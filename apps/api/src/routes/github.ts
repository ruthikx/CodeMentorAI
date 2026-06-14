import { Router } from "express";
import { asyncRoute } from "../lib/async-route.js";
import { githubReviewQueue } from "../lib/github-queue.js";
import { fetchGitHubRepos, verifyGitHubSignature } from "../lib/github.js";
import { prisma } from "../lib/prisma.js";
import { reviewRateLimitMiddleware } from "../middleware/rate-limit.js";
import type { AuthenticatedRequest } from "../types/express.js";

export const githubRouter = Router();

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

  const repos = await fetchGitHubRepos(accessToken);
  response.json({ repos });
}));

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
    const repos = await fetchGitHubRepos(accessToken);
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
