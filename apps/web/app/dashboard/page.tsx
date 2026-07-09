import { getServerSession } from "next-auth";
import {
  Award,
  BarChart3,
  Flame,
  LineChart,
  PieChart,
  Sparkles,
  Trophy,
  type LucideIcon
} from "lucide-react";
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
            <PanelHeading eyebrow="Dashboard unavailable" icon={BarChart3} title="Could not load learning analytics." />
            <p className="text-sm leading-7 text-neutral-400">
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
      <header className="grid gap-8 border-b border-white/5 pb-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
        <div className="max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-gradient-to-r from-white/[0.08] to-white/[0.02] px-3 py-1.5 text-sm font-medium text-neutral-300 shadow-[0_0_15px_rgba(255,255,255,0.03)] backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            Learning Dashboard
          </div>
          <div className="space-y-4">
            <h1 className="bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-[2.75rem] font-bold leading-[1.08] tracking-normal text-transparent sm:text-6xl">
              Track mistakes, streaks, and review momentum.
            </h1>
            <p className="max-w-3xl text-base leading-7 text-neutral-400 sm:text-lg sm:leading-relaxed">
              Analytics are modular so category breakdowns stay available on Free while trend, heatmap, streak, and badge insights unlock on Pro and Team.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl backdrop-blur-md">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
            <Sparkles className="h-5 w-5 text-blue-400" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">Current tier</p>
          <div className="mt-3 flex items-center justify-between gap-4">
            <span className="text-3xl font-bold uppercase text-white">{tier}</span>
            <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">
              {hasFullDashboard ? "Full access" : "Starter"}
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-neutral-400">
            {hasFullDashboard ? "All progress analytics are active." : "Upgrade to see trends, streaks, and badges."}
          </p>
        </div>
      </header>

      <section className={`grid gap-6 ${hasFullDashboard ? "lg:grid-cols-[1.2fr_0.8fr]" : ""}`}>
        <Panel>
          <PanelHeading eyebrow="Category Breakdown" icon={PieChart} title="Issues by severity" />
          <SeverityPieChart data={severityData} />
        </Panel>
        {hasFullDashboard ? (
          <Panel>
            <PanelHeading eyebrow="Review Volume" icon={BarChart3} title="Total reviews" />
            <div className="flex h-full min-h-72 flex-col justify-center rounded-3xl border border-white/5 bg-white/[0.02] p-6">
              <p className="text-7xl font-bold tracking-tight text-white">{summary.totalReviews}</p>
              <p className="mt-4 text-sm leading-7 text-neutral-400">
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
                <PanelHeading eyebrow="Growth Timeline" icon={LineChart} title="Issue frequency over 30 days" />
                <GrowthLineChart data={timeline} />
              </Panel>
              <Panel>
                <PanelHeading eyebrow="Streak Tracker" icon={Flame} title="Clean submission streak" />
                <div className="grid h-full min-h-80 content-center gap-4 sm:grid-cols-2">
                  <StreakStat label="Current streak" value={streak.current} />
                  <StreakStat label="Best streak" value={streak.best} />
                </div>
              </Panel>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <Panel>
                <PanelHeading eyebrow="Recurring Mistakes" icon={BarChart3} title="Top issue categories" />
                <CategoryHeatmap categories={topCategories} />
              </Panel>
              <Panel>
                <PanelHeading eyebrow="Milestones" icon={Award} title="Badges and progress" />
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
    <main className="relative min-h-screen overflow-hidden bg-[#050505] px-6 py-10 font-sans text-white selection:bg-blue-500/30 lg:px-10">
      <div className="pointer-events-none absolute left-1/4 top-24 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-20 right-0 h-[360px] w-[360px] rounded-full bg-blue-500/10 blur-[140px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f14_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f14_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_70%_45%_at_50%_0%,#000_55%,transparent_100%)]" />
      <div className="relative z-10 mx-auto max-w-[1400px] space-y-8">{children}</div>
    </main>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl backdrop-blur-md lg:p-6">
      {children}
    </section>
  );
}

function PanelHeading({ eyebrow, icon: Icon, title }: { eyebrow: string; icon: LucideIcon; title: string }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
        <Icon className="h-5 w-5 text-blue-400" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{title}</h2>
      </div>
    </div>
  );
}

function StreakStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#0b0b0c] p-5">
      <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
        <Trophy className="h-5 w-5 text-blue-400" />
      </div>
      <p className="text-sm text-neutral-400">{label}</p>
      <p className="mt-3 text-6xl font-bold tracking-tight text-white">{value}</p>
      <p className="mt-3 text-sm text-neutral-400">{value === 1 ? "day of clean code" : "days of clean code"}</p>
    </div>
  );
}

function CategoryHeatmap({ categories }: { categories: Array<{ category: string; count: number }> }) {
  const maxCount = Math.max(...categories.map((category) => category.count), 1);

  if (categories.length === 0) {
    return <p className="text-sm leading-7 text-neutral-400">No recurring mistake categories yet.</p>;
  }

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div key={category.category} className="space-y-2">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-medium text-neutral-100">{category.category}</span>
            <span className="text-neutral-500">{category.count}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
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
          <div key={badge.badge} className="rounded-2xl border border-white/10 bg-[#0b0b0c] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{meta.title}</p>
                <p className="mt-2 text-sm leading-6 text-neutral-400">{meta.description}</p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${
                  isEarned
                    ? "border-blue-400/20 bg-blue-500/10 text-blue-300"
                    : "border-white/10 bg-white/[0.04] text-neutral-300"
                }`}
              >
                {isEarned ? "Earned" : `${percent}%`}
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-neutral-500">
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
