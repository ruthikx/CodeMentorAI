import { getServerSession } from "next-auth";
import { GrowthLineChart, SeverityPieChart } from "../../src/components/dashboard-charts";
import { TierGate } from "../../src/components/tier-gate";
import { authOptions } from "../../src/lib/auth";
import { getMockDashboardData } from "../../src/lib/dashboard-mock";
import {
  dashboardFetch,
  normalizeStreak,
  type DashboardBadges,
  type DashboardSummary,
  type DashboardTrends
} from "../../src/lib/dashboard";
import type { ReviewSeverity } from "../../src/lib/review";
import { meetsTier, normalizeTier } from "../../src/lib/tiers";

const SEVERITY_ORDER: ReviewSeverity[] = ["style", "best_practice", "logic", "security"];

const BADGE_LABELS: Record<string, { title: string; description: string }> = {
  "first-review": {
    title: "First Review",
    description: "Submit your first code review."
  },
  "issue-resolver": {
    title: "Issue Resolver",
    description: "Accept fixes for 10 review issues."
  }
};

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: {
    mock?: string;
    tier?: string;
  };
}) {
  let summary: DashboardSummary;
  let mockTrends: DashboardTrends | null = null;
  let mockBadges: DashboardBadges | null = null;
  const useMockData = searchParams?.mock === "1" || searchParams?.mock === "true";
  const session = useMockData ? null : await getServerSession(authOptions);
  const apiToken = session?.apiToken;

  if (useMockData) {
    const mockData = getMockDashboardData(normalizeTierParam(searchParams?.tier));
    summary = mockData.summary;
    mockTrends = mockData.trends;
    mockBadges = mockData.badges;
  } else {
    try {
      summary = await dashboardFetch<DashboardSummary>("/api/dashboard/summary", apiToken);
    } catch (error) {
      return (
        <DashboardShell>
          <Panel>
            <p className="text-sm uppercase tracking-[0.32em] text-signal-red">Dashboard unavailable</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Could not load learning analytics.</h1>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {error instanceof Error ? error.message : "The dashboard API did not respond."}
            </p>
          </Panel>
        </DashboardShell>
      );
    }
  }

  const tier = summary.tier ?? "free";
  const hasFullDashboard = meetsTier(tier, "pro");
  const severityData = normalizeSeverityData(summary);

  const [trends, badges] = hasFullDashboard
    ? useMockData
      ? [mockTrends, mockBadges]
      : await Promise.all([
          dashboardFetch<DashboardTrends>("/api/dashboard/trends?days=30", apiToken),
          dashboardFetch<DashboardBadges>("/api/dashboard/badges", apiToken)
        ])
    : [null, null];

  const streak = normalizeStreak(summary.streak);
  const timeline = trends ? buildRollingTimeline(trends.timeline, 30) : [];
  const topCategories = trends?.topCategories.slice(0, 5) ?? [];

  return (
    <DashboardShell>
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.32em] text-signal-mint">Learning Dashboard</p>
          <h1 className="text-4xl font-semibold text-white">Track mistakes, streaks, and review momentum.</h1>
          <p className="max-w-3xl text-sm leading-7 text-slate-300">
            Analytics are modular so category breakdowns stay available on Free while trend, heatmap, streak, and badge insights unlock on Pro and Team.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">
          <span className="text-slate-400">Tier</span>
          <span className="ml-3 font-semibold uppercase text-white">{tier}</span>
        </div>
      </header>

      <section className={`grid gap-6 ${hasFullDashboard ? "lg:grid-cols-[1.2fr_0.8fr]" : ""}`}>
        <Panel>
          <PanelHeading eyebrow="Category Breakdown" title="Issues by severity" />
          <SeverityPieChart data={severityData} />
        </Panel>
        {hasFullDashboard ? (
          <Panel>
            <PanelHeading eyebrow="Review Volume" title="Total reviews" />
            <div className="flex h-full min-h-72 flex-col justify-center">
              <p className="text-7xl font-semibold text-white">{summary.totalReviews}</p>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Completed reviews included in your learning analytics and dashboard aggregations.
              </p>
            </div>
          </Panel>
        ) : null}
      </section>

      <TierGate
        currentTier={tier}
        requiredTier="pro"
        title="Unlock the full learning dashboard."
        description="Pro and Team tiers include the 30-day growth timeline, clean-code streak tracker, recurring mistake heatmap, and badge milestones."
      >
        {trends && badges ? (
          <>
            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <Panel>
                <PanelHeading eyebrow="Growth Timeline" title="Issue frequency over 30 days" />
                <GrowthLineChart data={timeline} />
              </Panel>
              <Panel>
                <PanelHeading eyebrow="Streak Tracker" title="Clean submission streak" />
                <div className="grid h-full min-h-80 content-center gap-4 sm:grid-cols-2">
                  <StreakStat label="Current streak" value={streak.current} />
                  <StreakStat label="Best streak" value={streak.best} />
                </div>
              </Panel>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <Panel>
                <PanelHeading eyebrow="Recurring Mistakes" title="Top issue categories" />
                <CategoryHeatmap categories={topCategories} />
              </Panel>
              <Panel>
                <PanelHeading eyebrow="Milestones" title="Badges and progress" />
                <BadgeGrid badges={badges} />
              </Panel>
            </section>
          </>
        ) : null}
      </TierGate>
    </DashboardShell>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#09111f_0%,_#101c30_100%)] px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">{children}</div>
    </main>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-card">{children}</section>;
}

function PanelHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-5 space-y-2">
      <p className="text-xs uppercase tracking-[0.24em] text-signal-mint">{eyebrow}</p>
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
    </div>
  );
}

function StreakStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#0b1220] p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-6xl font-semibold text-white">{value}</p>
      <p className="mt-3 text-sm text-slate-300">{value === 1 ? "day of clean code" : "days of clean code"}</p>
    </div>
  );
}

function CategoryHeatmap({ categories }: { categories: Array<{ category: string; count: number }> }) {
  const maxCount = Math.max(...categories.map((category) => category.count), 1);

  if (categories.length === 0) {
    return <p className="text-sm leading-7 text-slate-300">No recurring mistake categories yet.</p>;
  }

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div key={category.category} className="space-y-2">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-medium text-slate-100">{category.category}</span>
            <span className="text-slate-400">{category.count}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-signal-mint"
              style={{ width: `${Math.max(8, (category.count / maxCount) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function BadgeGrid({ badges }: { badges: DashboardBadges }) {
  const earned = new Set(badges.earned);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {badges.progress.map((badge) => {
        const meta = BADGE_LABELS[badge.badge] ?? {
          title: humanizeBadge(badge.badge),
          description: "Keep improving to unlock this milestone."
        };
        const isEarned = earned.has(badge.badge);
        const percent = badge.target > 0 ? Math.min(100, Math.round((badge.current / badge.target) * 100)) : 0;

        return (
          <div key={badge.badge} className="rounded-lg border border-white/10 bg-[#0b1220] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{meta.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{meta.description}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                  isEarned ? "bg-signal-mint/15 text-signal-mint" : "bg-white/10 text-slate-300"
                }`}
              >
                {isEarned ? "Earned" : `${percent}%`}
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-signal-mint" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {badge.current}/{badge.target}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function normalizeSeverityData(summary: DashboardSummary) {
  return SEVERITY_ORDER.map((severity) => ({
    severity,
    count: summary.issuesBySeverity?.find((entry) => entry.severity === severity)?.count ?? 0
  }));
}

function buildRollingTimeline(timeline: DashboardTrends["timeline"], days: number) {
  const issueCountByDay = new Map<string, number>();

  for (const entry of timeline) {
    const key = formatDateKey(new Date(entry.completedAt));
    issueCountByDay.set(key, (issueCountByDay.get(key) ?? 0) + entry.totalIssues);
  }

  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - (days - 1 - index));
    const key = formatDateKey(date);

    return {
      date: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(date),
      issues: issueCountByDay.get(key) ?? 0
    };
  });
}

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function humanizeBadge(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeTierParam(value: string | undefined) {
  return normalizeTier(value, "pro");
}
