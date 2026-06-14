"use client";

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
    <main className="min-h-screen bg-[linear-gradient(180deg,_#09111f_0%,_#101c30_100%)] px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.32em] text-signal.mint">IssueCard Mock</p>
          <h1 className="text-4xl font-semibold text-white">Review issue card preview</h1>
          <p className="max-w-3xl text-sm leading-7 text-slate-300">
            Mock data only. Use this page to check severity colors, Monaco diff loading, card focus, and accept/reject button states before wiring the review stream.
          </p>
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
