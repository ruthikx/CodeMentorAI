import type { DashboardBadges, DashboardSummary, DashboardTrends } from "./dashboard";
import type { UserTier } from "./tiers";

const CATEGORY_COUNTS = [
  { category: "Error Handling", count: 18 },
  { category: "Input Validation", count: 14 },
  { category: "Async Flow", count: 11 },
  { category: "Type Safety", count: 9 },
  { category: "Performance", count: 6 }
];

const TIMELINE_ISSUES = [5, 3, 4, 6, 2, 0, 1, 4, 3, 2, 5, 1, 0, 3, 2, 4, 1, 0, 2, 3, 1, 0, 1, 2, 0, 0, 1, 0, 0, 0];

export function getMockDashboardSummary(tier: UserTier = "pro"): DashboardSummary {
  return {
    tier,
    totalReviews: 42,
    issuesByCategory: CATEGORY_COUNTS,
    issuesBySeverity: [
      { severity: "style", count: 12 },
      { severity: "best_practice", count: 21 },
      { severity: "logic", count: 16 },
      { severity: "security", count: 9 }
    ],
    streak: {
      current: 4,
      best: 11
    }
  };
}

export function getMockDashboardTrends(days = 30): DashboardTrends {
  const timeline = Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setUTCHours(10, 30, 0, 0);
    date.setUTCDate(date.getUTCDate() - (days - 1 - index));

    return {
      completedAt: date.toISOString(),
      totalIssues: TIMELINE_ISSUES[index % TIMELINE_ISSUES.length]
    };
  });

  return {
    timeline,
    topCategories: CATEGORY_COUNTS
  };
}

export function getMockDashboardBadges(): DashboardBadges {
  return {
    earned: ["first-review", "issue-resolver", "clean-streak-3"],
    progress: [
      { badge: "first-review", current: 1, target: 1 },
      { badge: "issue-resolver", current: 18, target: 10 },
      { badge: "clean-streak-7", current: 4, target: 7 },
      { badge: "security-sweeper", current: 6, target: 12 }
    ]
  };
}

export function getMockDashboardData(tier: UserTier = "pro") {
  return {
    summary: getMockDashboardSummary(tier),
    trends: getMockDashboardTrends(30),
    badges: getMockDashboardBadges()
  };
}
