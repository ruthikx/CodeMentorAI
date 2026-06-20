import { Router } from "express";
import { streamChatWithFailover } from "@codementor-ai/ai/fallback";
import type { ReviewIssue } from "@codementor-ai/types";
import { asyncRoute } from "../lib/async-route.js";
import { prisma } from "../lib/prisma.js";
import { emitReviewEvent, subscribeToReviewEvents } from "../lib/review-events.js";
import { runReviewGeneration, toReviewIssueSummary } from "../lib/review-runner.js";
import { closeSSE, sendSSE, setupSSE } from "../lib/sse.js";
import { reviewRateLimitMiddleware } from "../middleware/rate-limit.js";
import { reviewSubmissionSizeMiddleware } from "../middleware/review-size.js";
import type { AuthenticatedRequest } from "../types/express.js";

interface CreateReviewBody {
  code: string;
  language: string;
  filename?: string;
}

interface ChatBody {
  message: string;
  history?: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
}

export const reviewsRouter = Router();

reviewsRouter.post(
  "/",
  reviewRateLimitMiddleware,
  reviewSubmissionSizeMiddleware,
  asyncRoute(async (request: AuthenticatedRequest<Record<string, string>, unknown, CreateReviewBody>, response) => {
    const { code, language, filename } = request.body;

    if (typeof code !== "string" || typeof language !== "string" || code.length === 0 || language.length === 0) {
      response.status(400).json({ error: "code and language are required." });
      return;
    }

    const userId = request.auth.userId;

    const submission = await prisma.codeSubmission.create({
      data: {
        userId,
        language,
        sourceCode: code,
        filename: filename ?? null
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

    void runReviewGeneration({
      reviewId: review.id,
      submissionId: submission.id,
      userId,
      language,
      sourceCode: code
    });

    response.status(202).json({
      reviewId: review.id,
      status: "processing"
    });
  })
);

reviewsRouter.get("/:id", asyncRoute(async (request: AuthenticatedRequest<{ id: string }>, response) => {
  const review = await prisma.reviewResult.findFirst({
    where: {
      id: request.params.id,
      submission: {
        userId: request.auth.userId
      }
    },
    include: {
      reviewIssues: true,
      submission: true
    }
  });

  if (!review) {
    response.status(404).json({ error: "Review not found." });
    return;
  }

  response.json({
    reviewId: review.id,
    status: review.status,
    issues: review.reviewIssues,
    completedAt: review.completedAt,
    submission: {
      id: review.submission.id,
      language: review.submission.language,
      filename: review.submission.filename,
      sourceCode: review.submission.sourceCode,
      submittedAt: review.submission.submittedAt
    }
  });
}));

reviewsRouter.get("/:id/stream", asyncRoute(async (request: AuthenticatedRequest<{ id: string }>, response) => {
  const review = await prisma.reviewResult.findFirst({
    where: {
      id: request.params.id,
      submission: {
        userId: request.auth.userId
      }
    },
    include: {
      reviewIssues: true
    }
  });

  if (!review) {
    response.status(404).json({ error: "Review not found." });
    return;
  }

  setupSSE(response);
  sendSSE(response, "status", { reviewId: review.id, status: review.status });

  for (const issue of review.reviewIssues) {
    sendSSE(response, "issue", issue);
  }

  if (review.status === "complete" || review.status === "failed") {
    sendSSE(response, "complete", {
      reviewId: review.id,
      status: review.status,
      completedAt: review.completedAt
    });
    closeSSE(response);
    return;
  }

  const unsubscribe = subscribeToReviewEvents(review.id, (event) => {
    sendSSE(response, event.type, event.payload);
    if (event.type === "complete" || event.type === "error") {
      unsubscribe();
      closeSSE(response);
    }
  });

  request.on("close", () => {
    unsubscribe();
    closeSSE(response);
  });
}));

reviewsRouter.post(
  "/:id/chat",
  asyncRoute(async (
    request: AuthenticatedRequest<{ id: string }, unknown, ChatBody>,
    response
  ) => {
    const review = await prisma.reviewResult.findFirst({
      where: {
        id: request.params.id,
        submission: {
          userId: request.auth.userId
        }
      },
      include: {
        submission: true,
        reviewIssues: true
      }
    });

    if (!review) {
      response.status(404).json({ error: "Review not found." });
      return;
    }

    const currentIssue = review.reviewIssues[0];
    setupSSE(response);
    try {
      await streamChatWithFailover(
        {
          language: review.submission.language,
          sourceCode: review.submission.sourceCode,
          reviewId: review.id,
          issue: currentIssue ? toReviewIssueSummary(currentIssue as ReviewIssue) : null,
          conversationHistory: request.body.history ?? [],
          message: request.body.message
        },
        {
          onTextDelta: async (delta) => {
            sendSSE(response, "chat", { delta });
            emitReviewEvent(review.id, { type: "chat", payload: { delta } });
          }
        }
      );

      sendSSE(response, "complete", { reviewId: review.id });
    } catch (error) {
      sendSSE(response, "error", {
        reviewId: review.id,
        message: error instanceof Error ? error.message : String(error)
      });
    } finally {
      closeSSE(response);
    }
  })
);

reviewsRouter.patch(
  "/:id/issues/:issueId",
  asyncRoute(async (
    request: AuthenticatedRequest<{ id: string; issueId: string }, unknown, { accepted: boolean }>,
    response
  ) => {
    const issue = await prisma.reviewIssue.findFirst({
      where: {
        id: request.params.issueId,
        reviewId: request.params.id,
        review: {
          submission: {
            userId: request.auth.userId
          }
        }
      }
    });

    if (!issue) {
      console.log("[reviews] Issue decision update failed: issue not found.", {
        reviewId: request.params.id,
        issueId: request.params.issueId,
        userId: request.auth.userId
      });
      response.status(404).json({ error: "Issue not found." });
      return;
    }

    try {
      await prisma.reviewIssue.update({
        where: { id: issue.id },
        data: {
          accepted: Boolean(request.body.accepted)
        }
      });
    } catch (error) {
      console.log("[reviews] Issue decision update failed.", {
        reviewId: request.params.id,
        issueId: request.params.issueId,
        userId: request.auth.userId,
        accepted: Boolean(request.body.accepted),
        error
      });
      throw error;
    }

    response.json({ updated: true });
  })
);
