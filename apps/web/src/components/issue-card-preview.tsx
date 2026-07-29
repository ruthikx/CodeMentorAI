"use client";

import { Bug, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReviewIssue, ReviewSeverity } from "../lib/review";
import { IssueCard } from "./issue-card";

const MOCK_SOURCE_CODE = `type ReviewStatus = "pending" | "processing" | "complete" | "failed";

interface ReviewEvent {
  id: string;
  status: ReviewStatus;
  issueCount?: number;
  token: string;
}

export function summarizeReview(event: ReviewEvent) {
  if (event.status = "complete") {
    return "Review completed";
  }

  console.log("review token", event.token);

  const issueCount = event.issueCount || 0;

  return "Found " + issueCount + " issues";
}

export function formatIssueCount(count: number) {
  return count == 1 ? "1 issue" : count + " issues";
}`;

const MOCK_ISSUES: ReviewIssue[] = [
  createIssue({
    id: "mock-style",
    severity: "style",
    category: "Readability",
    lineStart: 18,
    lineEnd: 18,
    title: "Prefer template strings for composed messages",
    explanation:
      "String concatenation works here, but a template string keeps the message easier to scan when the expression grows.",
    suggestedFix: `  return \`Found \${issueCount} issues\`;`
  }),
  createIssue({
    id: "mock-best-practice",
    severity: "best_practice",
    category: "Type Safety",
    lineStart: 22,
    lineEnd: 22,
    title: "Use strict equality for numeric comparisons",
    explanation:
      "Loose equality can hide coercion bugs. Strict equality keeps this helper predictable when values arrive from forms or query params.",
    suggestedFix: `  return count === 1 ? "1 issue" : \`\${count} issues\`;`
  }),
  createIssue({
    id: "mock-logic",
    severity: "logic",
    category: "Control Flow",
    lineStart: 9,
    lineEnd: 11,
    title: "Completion check assigns instead of compares",
    explanation:
      "The condition currently assigns the status, so this branch always behaves like a completed review. Compare the value instead.",
    suggestedFix: `  if (event.status === "complete") {
    return "Review completed";
  }`
  }),
  createIssue({
    id: "mock-security",
    severity: "security",
    category: "Sensitive Data",
    lineStart: 14,
    lineEnd: 14,
    title: "Avoid logging review tokens",
    explanation:
      "Tokens can end up in shared logs or browser tooling. Keep the diagnostic message, but remove the secret value from the log.",
    suggestedFix: `  console.log("review status", event.status);`
  })
];

export function IssueCardPreview() {
  const [activeId, setActiveId] = useState(MOCK_ISSUES[0]?.id ?? "");
  const [decisions, setDecisions] = useState<Record<string, boolean>>({});

  const issues = useMemo(
    () => MOCK_ISSUES.map((issue) => ({ ...issue, accepted: decisions[issue.id] ?? issue.accepted })),
    [decisions]
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] px-6 py-10 text-white lg:px-10 lg:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f14_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f14_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:linear-gradient(to_bottom,#000_0%,transparent_74%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.14),transparent_68%)]" />

      <div className="relative z-10 mx-auto max-w-[1400px] space-y-8">
        <header className="grid gap-8 border-b border-white/5 pb-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div className="max-w-4xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-neutral-300">
              <Bug className="h-4 w-4 text-blue-400" />
              Issue Card Mock
            </div>
            <div className="space-y-4">
              <h1 className="bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-[2.75rem] font-bold leading-[1.08] tracking-normal text-transparent sm:text-6xl">
                Review issue card preview.
              </h1>
              <p className="max-w-3xl text-base leading-7 text-neutral-400 sm:text-lg">
                Check severity colors, Monaco diff loading, keyboard focus, and accept or reject states with local mock data.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <Sparkles className="h-5 w-5 text-blue-400" />
            <div>
              <p className="text-2xl font-semibold text-white">{issues.length}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Mock findings</p>
            </div>
          </div>
        </header>

        <div className="grid gap-5">
          {issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              sourceCode={MOCK_SOURCE_CODE}
              language="typescript"
              active={issue.id === activeId}
              onFocus={() => setActiveId(issue.id)}
              onAccept={(accepted) => {
                setActiveId(issue.id);
                setDecisions((current) => ({ ...current, [issue.id]: accepted }));
              }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

function createIssue(params: {
  id: string;
  severity: ReviewSeverity;
  category: string;
  lineStart: number;
  lineEnd: number;
  title: string;
  explanation: string;
  suggestedFix: string;
}): ReviewIssue {
  return {
    reviewId: "mock-review",
    accepted: false,
    ...params
  };
}
