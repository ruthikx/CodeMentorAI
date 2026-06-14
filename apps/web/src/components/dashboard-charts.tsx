"use client";

import dynamic from "next/dynamic";
import type { ReviewSeverity } from "../lib/review";

type SeverityPieChartProps = {
  data: Array<{
    severity: ReviewSeverity;
    count: number;
  }>;
};

type GrowthLineChartProps = {
  data: Array<{
    date: string;
    issues: number;
  }>;
};

type CategoryBarChartProps = {
  data: Array<{
    category: string;
    count: number;
  }>;
};

function ChartSkeleton({ heightClass = "h-72 min-h-72" }: { heightClass?: string }) {
  return (
    <div className={`${heightClass} rounded-lg border border-white/10 bg-[#0b1220] p-4`} aria-label="Loading chart">
      <div className="flex h-full items-end gap-3">
        {[42, 68, 54, 82, 38, 74, 58, 46].map((height, index) => (
          <div key={index} className="flex flex-1 items-end">
            <div className="w-full rounded-t bg-slate-700/70" style={{ height: `${height}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export const SeverityPieChart = dynamic<SeverityPieChartProps>(
  () => import("./dashboard-chart-renderers").then((mod) => mod.SeverityPieChartRenderer),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
);

export const GrowthLineChart = dynamic<GrowthLineChartProps>(
  () => import("./dashboard-chart-renderers").then((mod) => mod.GrowthLineChartRenderer),
  {
    ssr: false,
    loading: () => <ChartSkeleton heightClass="h-80 min-h-80" />
  }
);

export const CategoryBarChart = dynamic<CategoryBarChartProps>(
  () => import("./dashboard-chart-renderers").then((mod) => mod.CategoryBarChartRenderer),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
);
