import { Router } from "express";
import { asyncRoute } from "../lib/async-route.js";
import { prisma } from "../lib/prisma.js";
import type { AuthenticatedRequest } from "../types/express.js";

export const dashboardRouter = Router();

type CategoryCount = {
  category: string;
  _count: {
    category: number;
  };
};

type SeverityCount = {
  severity: string;
  _count: {
    severity: number;
  };
};

type ReviewTrend = {
  completedAt: Date | null;
  totalIssues: number;
};

dashboardRouter.get("/summary", asyncRoute(async (request: AuthenticatedRequest, response) => {
  const [totalReviews, groupedIssues, groupedSeverities, learningMetrics] = await Promise.all([
    prisma.reviewResult.count({
      where: {
        submission: {
          userId: request.auth.userId
        }
      }
    }),
    prisma.reviewIssue.groupBy({
      by: ["category"],
      _count: {
        category: true
      },
      where: {
        review: {
          submission: {
            userId: request.auth.userId
          }
        }
      }
    }),
    prisma.reviewIssue.groupBy({
      by: ["severity"],
      _count: {
        severity: true
      },
      where: {
        review: {
          submission: {
            userId: request.auth.userId
          }
        }
      }
    }),
    prisma.learningMetrics.findUnique({
      where: {
        userId: request.auth.userId
      }
    })
  ]);

  response.json({
    tier: request.auth.tier,
    totalReviews,
    issuesByCategory: (groupedIssues as CategoryCount[]).map((entry) => ({
      category: entry.category,
      count: entry._count.category
    })),
    issuesBySeverity: (groupedSeverities as SeverityCount[]).map((entry) => ({
      severity: entry.severity,
      count: entry._count.severity
    })),
    streak: {
      current: learningMetrics?.currentStreak ?? 0,
      best: learningMetrics?.longestStreak ?? learningMetrics?.currentStreak ?? 0
    }
  });
}));

dashboardRouter.get("/trends", asyncRoute(async (request: AuthenticatedRequest, response) => {
  const days = Number.parseInt(String(request.query.days ?? "30"), 10);
  const startDate = new Date();
  startDate.setUTCDate(startDate.getUTCDate() - days);

  const [reviews, topCategories] = await Promise.all([
    prisma.reviewResult.findMany({
      where: {
        submission: {
          userId: request.auth.userId
        },
        completedAt: {
          gte: startDate
        }
      },
      orderBy: {
        completedAt: "asc"
      },
      select: {
        completedAt: true,
        totalIssues: true
      }
    }),
    prisma.reviewIssue.groupBy({
      by: ["category"],
      _count: {
        category: true
      },
      where: {
        review: {
          submission: {
            userId: request.auth.userId
          }
        }
      },
      orderBy: {
        _count: {
          category: "desc"
        }
      },
      take: 5
    })
  ]);

  response.json({
    timeline: (reviews as ReviewTrend[]).map((review) => ({
      completedAt: review.completedAt,
      totalIssues: review.totalIssues
    })),
    topCategories: (topCategories as CategoryCount[]).map((entry) => ({
      category: entry.category,
      count: entry._count.category
    }))
  });
}));

dashboardRouter.get("/badges", asyncRoute(async (request: AuthenticatedRequest, response) => {
  const metrics = await prisma.learningMetrics.findUnique({
    where: {
      userId: request.auth.userId
    }
  });

  const totalReviews = metrics?.totalReviews ?? 0;
  const issuesResolved = metrics?.issuesResolved ?? 0;

  response.json({
    earned: [
      ...(totalReviews >= 1 ? ["first-review"] : []),
      ...(issuesResolved >= 10 ? ["issue-resolver"] : [])
    ],
    progress: [
      { badge: "first-review", current: Math.min(totalReviews, 1), target: 1 },
      { badge: "issue-resolver", current: issuesResolved, target: 10 }
    ]
  });
}));
