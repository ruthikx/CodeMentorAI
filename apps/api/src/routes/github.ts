import { Router } from "express";
import { AIServiceUnavailableError, streamRepoReviewWithFailover } from "@codementor-ai/ai/fallback";
import { asyncRoute } from "../lib/async-route.js";
import { githubReviewQueue } from "../lib/github-queue.js";
import { fetchGitHubRepos, verifyGitHubSignature } from "../lib/github.js";
import { prisma } from "../lib/prisma.js";
import { preparePublicRepoReview, RepoReviewError } from "../lib/repo-review.js";
import { reviewRateLimitMiddleware } from "../middleware/rate-limit.js";
import type { AuthenticatedRequest } from "../types/express.js";

export const githubRouter = Router();

interface PublicRepoReviewBody {
  url: string;
  focus?: string;
}

function isGitHubUnauthorizedError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("status 401");
}

function sendGitHubUnauthorized(response: { status: (code: number) => { json: (body: { error: string }) => void } }) {
  response.status(401).json({
    error: "GitHub authorization failed. Sign in with GitHub again or update GITHUB_ACCESS_TOKEN."
  });
}

githubRouter.post("/webhook", asyncRoute(async (request, response) => {
  const rawBody = (request as AuthenticatedRequest).rawBody ?? Buffer.from("");
  const signature = request.header("x-hub-signature-256");

  if (!verifyGitHubSignature(rawBody, signature)) {
    response.status(401).json({ error: "Invalid GitHub signature." });
    return;
  }

  response.status(202).json({ accepted: true });
}));

githubRouter.get("/repos", asyncRoute(async (request: AuthenticatedRequest, response) => {
  const accessToken = request.auth.githubAccessToken ?? process.env.GITHUB_ACCESS_TOKEN;
  if (!accessToken) {
    response.json({ repos: [] });
    return;
  }

  const repos = await fetchGitHubRepos(accessToken).catch((error: unknown) => {
    if (isGitHubUnauthorizedError(error)) {
      sendGitHubUnauthorized(response);
      return null;
    }

    throw error;
  });

  if (!repos) {
    return;
  }

  response.json({ repos });
}));

githubRouter.post(
  "/repo-review",
  reviewRateLimitMiddleware,
  asyncRoute(async (
    request: AuthenticatedRequest<Record<string, string>, unknown, PublicRepoReviewBody>,
    response
  ) => {
    const { url, focus } = request.body;

    if (typeof url !== "string" || url.trim().length === 0) {
      response.status(400).json({ error: "GitHub repository URL is required." });
      return;
    }

    if (focus !== undefined && typeof focus !== "string") {
      response.status(400).json({ error: "Review focus must be a string when provided." });
      return;
    }

    const normalizedFocus = focus?.trim();
    if (normalizedFocus && normalizedFocus.length > 500) {
      response.status(400).json({ error: "Review focus must be 500 characters or fewer." });
      return;
    }

    try {
      const preparedRepo = await preparePublicRepoReview(url);
      const aiResponse = await streamRepoReviewWithFailover({
        ...preparedRepo,
        focus: normalizedFocus,
        maxFindings: 8
      }, {
        timeoutMs: getRepoReviewAiTimeoutMs()
      });

      response.json(aiResponse.report);
    } catch (error) {
      if (error instanceof RepoReviewError) {
        response.status(error.statusCode).json({ error: error.message });
        return;
      }

      if (error instanceof AIServiceUnavailableError) {
        response.status(error.statusCode).json({
          error: "Repository review is temporarily unavailable. Try again in a few minutes."
        });
        return;
      }

      throw error;
    }
  })
);

githubRouter.post(
  "/repos/:repoId/review",
  reviewRateLimitMiddleware,
  asyncRoute(async (
    request: AuthenticatedRequest<{ repoId: string }, unknown, { prNumber: number }>,
    response
  ) => {
    const accessToken = request.auth.githubAccessToken ?? process.env.GITHUB_ACCESS_TOKEN;
    if (!accessToken) {
      response.status(400).json({ error: "Missing GitHub access token." });
      return;
    }

    const repoId = Number.parseInt(request.params.repoId, 10);
    const repos = await fetchGitHubRepos(accessToken).catch((error: unknown) => {
      if (isGitHubUnauthorizedError(error)) {
        sendGitHubUnauthorized(response);
        return null;
      }

      throw error;
    });

    if (!repos) {
      return;
    }

    const repo = repos.find((entry) => entry.id === repoId);

    if (!repo) {
      response.status(404).json({ error: "Repository not found." });
      return;
    }

    const submission = await prisma.codeSubmission.create({
      data: {
        userId: request.auth.userId,
        language: "diff",
        sourceCode: "",
        filename: repo.fullName,
        githubPrId: request.body.prNumber
      }
    });

    const review = await prisma.reviewResult.create({
      data: {
        submissionId: submission.id,
        status: "processing",
        totalIssues: 0,
        providerUsed: "groq"
      }
    });

    await githubReviewQueue.add({
      reviewId: review.id,
      submissionId: submission.id,
      userId: request.auth.userId,
      repoFullName: repo.fullName,
      prNumber: request.body.prNumber,
      githubAccessToken: accessToken
    });

    response.json({ reviewId: review.id });
  })
);

function getRepoReviewAiTimeoutMs(): number {
  const parsed = Number.parseInt(process.env.REPO_REVIEW_AI_TIMEOUT_MS ?? "20000", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 20_000;
}
