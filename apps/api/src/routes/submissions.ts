import { Router } from "express";
import { asyncRoute } from "../lib/async-route.js";
import { prisma } from "../lib/prisma.js";
import type { AuthenticatedRequest } from "../types/express.js";

export const submissionsRouter = Router();

type SubmissionListItem = {
  id: string;
  language: string;
  filename: string | null;
  submittedAt: Date;
  githubPrId: bigint | number | null;
  reviewResults: Array<{ id: string }>;
};

submissionsRouter.get("/", asyncRoute(async (request: AuthenticatedRequest, response) => {
  const page = Number.parseInt(String(request.query.page ?? "1"), 10);
  const limit = Number.parseInt(String(request.query.limit ?? "20"), 10);
  const language = typeof request.query.lang === "string" ? request.query.lang : undefined;
  const where = {
    userId: request.auth.userId,
    ...(language ? { language } : {})
  };

  const [submissions, total] = await Promise.all([
    prisma.codeSubmission.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        reviewResults: {
          select: {
            id: true
          },
          orderBy: {
            completedAt: "desc"
          },
          take: 1
        }
      }
    }),
    prisma.codeSubmission.count({ where })
  ]);

  response.json({
    submissions: (submissions as SubmissionListItem[]).map((submission) => ({
      id: submission.id,
      language: submission.language,
      filename: submission.filename,
      submittedAt: submission.submittedAt,
      githubPrId: submission.githubPrId,
      latestReviewId: submission.reviewResults[0]?.id ?? null
    })),
    total,
    page
  });
}));

submissionsRouter.get("/:id", asyncRoute(async (request: AuthenticatedRequest<{ id: string }>, response) => {
  const submission = await prisma.codeSubmission.findFirst({
    where: {
      id: request.params.id,
      userId: request.auth.userId
    },
    include: {
      reviewResults: {
        include: {
          reviewIssues: true
        },
        orderBy: {
          completedAt: "desc"
        },
        take: 1
      }
    }
  });

  if (!submission) {
    response.status(404).json({ error: "Submission not found." });
    return;
  }

  const review = submission.reviewResults[0] ?? null;
  response.json({
    submission,
    review,
    issues: review?.reviewIssues ?? []
  });
}));

submissionsRouter.delete("/:id", asyncRoute(async (request: AuthenticatedRequest<{ id: string }>, response) => {
  const submission = await prisma.codeSubmission.findFirst({
    where: {
      id: request.params.id,
      userId: request.auth.userId
    }
  });

  if (!submission) {
    response.status(404).json({ error: "Submission not found." });
    return;
  }

  await prisma.codeSubmission.delete({
    where: { id: submission.id }
  });

  response.json({ deleted: true });
}));
