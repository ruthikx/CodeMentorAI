"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { ReviewSeverity } from "../lib/review";

const SEVERITY_META: Record<ReviewSeverity, { label: string; color: string }> = {
  style: { label: "Style", color: "#3a8dff" },
  best_practice: { label: "Best Practice", color: "#e6b422" },
  logic: { label: "Logic", color: "#ef7f39" },
  security: { label: "Security", color: "#d84f4f" }
};

const SEVERITY_ORDER: ReviewSeverity[] = ["style", "best_practice", "logic", "security"];

export function SeverityPieChartRenderer({
  data
}: {
  data: Array<{
    severity: ReviewSeverity;
    count: number;
  }>;
}) {
  const chartData = SEVERITY_ORDER.map((severity) => ({
    severity,
    name: SEVERITY_META[severity].label,
    count: data.find((entry) => entry.severity === severity)?.count ?? 0
  }));

  return (
    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
      <div className="h-72 min-h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="count" nameKey="name" innerRadius={58} outerRadius={100} paddingAngle={3}>
              {chartData.map((entry) => (
                <Cell key={entry.severity} fill={SEVERITY_META[entry.severity].color} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid gap-3">
        {chartData.map((entry) => (
          <div key={entry.severity} className="flex items-center justify-between rounded-lg bg-white/[0.04] px-4 py-3">
            <span className="flex items-center gap-3 text-sm text-slate-200">
              <span className="h-3 w-3 rounded-full" style={{ background: SEVERITY_META[entry.severity].color }} />
              {entry.name}
            </span>
            <span className="text-sm font-semibold text-white">{entry.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GrowthLineChartRenderer({
  data
}: {
  data: Array<{
    date: string;
    issues: number;
  }>;
}) {
  return (
    <div className="h-80 min-h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis
            stroke="#94a3b8"
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            fontSize={12}
            label={{ value: "Issue count", angle: -90, position: "insideLeft", fill: "#94a3b8" }}
          />
          <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }} />
          <Line type="monotone" dataKey="issues" name="Issues" stroke="#7ad7bf" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryBarChartRenderer({
  data
}: {
  data: Array<{
    category: string;
    count: number;
  }>;
}) {
  return (
    <div className="h-72 min-h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 20 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" horizontal={false} />
          <XAxis type="number" stroke="#94a3b8" tickLine={false} axisLine={false} allowDecimals={false} fontSize={12} />
          <YAxis type="category" dataKey="category" width={118} stroke="#cbd5e1" tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }} />
          <Bar dataKey="count" name="Issues" fill="#7ad7bf" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
