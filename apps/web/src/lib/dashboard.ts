import { apiUrl } from "./api";
import type { ReviewSeverity } from "./review";
import type { UserTier } from "./tiers";
export type { UserTier } from "./tiers";

export interface DashboardSummary {
  tier?: UserTier;
  totalReviews: number;
  issuesByCategory: Array<{
    category: string;
    count: number;
  }>;
  issuesBySeverity?: Array<{
    severity: ReviewSeverity;
    count: number;
  }>;
  streak:
    | number
    | {
        current: number;
        best: number;
      };
}

export interface DashboardTrends {
  timeline: Array<{
    completedAt: string;
    totalIssues: number;
  }>;
  topCategories: Array<{
    category: string;
    count: number;
  }>;
}

export interface DashboardBadges {
  earned: string[];
  progress: Array<{
    badge: string;
    current: number;
    target: number;
  }>;
}

export function normalizeStreak(streak: DashboardSummary["streak"]) {
  if (typeof streak === "number") {
    return {
      current: streak,
      best: streak
    };
  }

  return streak;
}

export async function dashboardFetch<T>(path: string): Promise<T> {
  const token = process.env.NEXT_PUBLIC_API_TOKEN;
  const response = await fetch(apiUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    let message = `Dashboard request failed with status ${response.status}.`;

    try {
      const payload = (await response.json()) as { error?: string; detail?: string };
      message = payload.error ?? payload.detail ?? message;
    } catch {
      // Keep the HTTP status message when the API does not return JSON.
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}
