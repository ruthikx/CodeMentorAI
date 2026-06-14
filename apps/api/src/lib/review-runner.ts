import type { ReviewIssue } from "@codementor-ai/types";
import { streamReviewWithFailover } from "@codementor-ai/ai/fallback";
import { prisma } from "./prisma.js";
import { emitReviewEvent } from "./review-events.js";

export async function runReviewGeneration(params: {
  reviewId: string;
  submissionId: string;
  userId: string;
  language: string;
  sourceCode: string;
}): Promise<void> {
  const issueIds: string[] = [];

  try {
    const response = await streamReviewWithFailover(
      {
        language: params.language,
        sourceCode: params.sourceCode,
        reviewId: params.reviewId
      },
      {
        onIssue: async (issue) => {
          const createdIssue = await prisma.reviewIssue.create({
            data: {
              id: issue.id,
              reviewId: params.reviewId,
              severity: issue.severity,
              category: issue.category,
              lineStart: issue.lineStart,
              lineEnd: issue.lineEnd,
              title: issue.title,
              explanation: issue.explanation,
              suggestedFix: issue.suggestedFix,
              accepted: false
            }
          });

          issueIds.push(createdIssue.id);
          emitReviewEvent(params.reviewId, {
            type: "issue",
            payload: createdIssue
          });
        }
      }
    );

    await prisma.reviewResult.update({
      where: { id: params.reviewId },
      data: {
        status: "complete",
        totalIssues: issueIds.length,
        providerUsed: response.providerUsed,
        modelUsed: response.modelUsed,
        promptTokens: response.promptTokens,
        completionTokens: response.completionTokens,
        completedAt: new Date()
      }
    });

    await incrementLearningMetrics(params.userId);
    emitReviewEvent(params.reviewId, {
      type: "complete",
      payload: {
        reviewId: params.reviewId,
        status: "complete",
        totalIssues: issueIds.length,
        providerUsed: response.providerUsed,
        completedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    await prisma.reviewResult.update({
      where: { id: params.reviewId },
      data: {
        status: "failed",
        completedAt: new Date()
      }
    });

    emitReviewEvent(params.reviewId, {
      type: "error",
      payload: {
        reviewId: params.reviewId,
        status: "failed",
        message: error instanceof Error ? error.message : String(error)
      }
    });
  }
}

async function incrementLearningMetrics(userId: string): Promise<void> {
  const totals = await prisma.reviewResult.count({
    where: {
      submission: {
        userId
      }
    }
  });

  const resolvedIssues = await prisma.reviewIssue.count({
    where: {
      accepted: true,
      review: {
        submission: {
          userId
        }
      }
    }
  });

  await prisma.learningMetrics.upsert({
    where: { userId },
    update: {
      totalReviews: totals,
      totalSubmissions: await prisma.codeSubmission.count({ where: { userId } }),
      issuesResolved: resolvedIssues,
      updatedAt: new Date()
    },
    create: {
      userId,
      totalReviews: totals,
      totalSubmissions: await prisma.codeSubmission.count({ where: { userId } }),
      issuesResolved: resolvedIssues,
      currentStreak: 0,
      longestStreak: 0
    }
  });
}

export function toReviewIssueSummary(issue: ReviewIssue): Pick<
  ReviewIssue,
  "severity" | "category" | "lineStart" | "lineEnd" | "title" | "explanation" | "suggestedFix"
> {
  return {
    severity: issue.severity,
    category: issue.category,
    lineStart: issue.lineStart,
    lineEnd: issue.lineEnd,
    title: issue.title,
    explanation: issue.explanation,
    suggestedFix: issue.suggestedFix
  };
}
