"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch } from "../lib/api";
import type { RepoReviewReport, RepoReviewSeverity } from "../lib/repo-review";

const FOCUS_OPTIONS = ["bugs", "security", "performance", "architecture", "tests"] as const;

export function RepoReviewPanel() {
  const [repoUrl, setRepoUrl] = useState("");
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
  const [customFocus, setCustomFocus] = useState("");

  const reviewRepo = useMutation({
    mutationFn: () =>
      apiFetch<RepoReviewReport>("/api/github/repo-review", {
        method: "POST",
        body: JSON.stringify({
          url: repoUrl,
          focus: buildFocus(selectedFocus, customFocus) || undefined
        })
      })
  });

  const report = reviewRepo.data;

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-card">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-signal-mint">Repository Review</p>
            <h2 className="text-2xl font-semibold text-white">Review a public GitHub repo</h2>
            <p className="text-sm leading-7 text-slate-300">
              Submit a public repository URL. The API fetches source through GitHub, filters noisy files, and reviews static excerpts only.
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              reviewRepo.mutate();
            }}
          >
            <label className="block space-y-2 text-sm text-slate-300">
              <span>Repository URL</span>
              <input
                value={repoUrl}
                onChange={(event) => setRepoUrl(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0b1220] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-signal-mint"
                placeholder="https://github.com/owner/repo"
                disabled={reviewRepo.isPending}
              />
            </label>

            <div className="space-y-2">
              <p className="text-sm text-slate-300">Focus</p>
              <div className="flex flex-wrap gap-2">
                {FOCUS_OPTIONS.map((focus) => {
                  const active = selectedFocus.includes(focus);

                  return (
                    <button
                      key={focus}
                      type="button"
                      onClick={() => toggleFocus(focus, selectedFocus, setSelectedFocus)}
                      className={`rounded-lg border px-3 py-2 text-sm transition ${
                        active
                          ? "border-signal-mint bg-signal-mint/15 text-signal-mint"
                          : "border-white/10 bg-[#0b1220] text-slate-300 hover:border-white/25"
                      }`}
                      disabled={reviewRepo.isPending}
                    >
                      {focus}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="block space-y-2 text-sm text-slate-300">
              <span>Optional notes</span>
              <textarea
                value={customFocus}
                onChange={(event) => setCustomFocus(event.target.value)}
                className="min-h-24 w-full resize-y rounded-lg border border-white/10 bg-[#0b1220] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-signal-mint"
                placeholder="Prioritize auth, data validation, or test coverage."
                maxLength={500}
                disabled={reviewRepo.isPending}
              />
            </label>

            <button
              type="submit"
              disabled={reviewRepo.isPending || repoUrl.trim().length === 0}
              className="w-full rounded-lg bg-paper px-5 py-3 font-medium text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {reviewRepo.isPending ? "Reviewing Repo..." : "Review GitHub Repo"}
            </button>
          </form>

          {reviewRepo.isPending ? (
            <div className="rounded-lg border border-signal-mint/30 bg-signal-mint/10 px-4 py-3 text-sm text-signal-mint">
              Fetching repository metadata, selecting source files, and generating the review report.
            </div>
          ) : null}

          {reviewRepo.error ? (
            <div className="rounded-lg border border-signal-red/30 bg-signal-red/10 px-4 py-3 text-sm text-signal-red">
              {reviewRepo.error.message}
            </div>
          ) : null}
        </div>

        <div className="min-h-96 rounded-lg border border-white/10 bg-[#0b1220] p-5">
          {report ? <RepoReviewReportView report={report} /> : <EmptyReportState />}
        </div>
      </div>
    </section>
  );
}

function RepoReviewReportView({ report }: { report: RepoReviewReport }) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
            {report.repo.defaultBranch}
          </span>
          <span className="rounded-lg bg-signal-mint/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-signal-mint">
            {report.stats.filesScanned} files
          </span>
        </div>
        <h3 className="text-2xl font-semibold text-white">{report.repo.name}</h3>
        <p className="text-sm leading-7 text-slate-300">{report.summary}</p>
      </div>

      {report.stats.languages.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {report.stats.languages.map((language) => (
            <span key={language} className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-300">
              {language}
            </span>
          ))}
        </div>
      ) : null}

      <div className="space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Findings</h4>
        {report.findings.length > 0 ? (
          report.findings.map((finding, index) => (
            <article key={`${finding.file}:${finding.line ?? "repo"}:${finding.title}:${index}`} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <SeverityBadge severity={finding.severity} />
                  <h5 className="text-lg font-semibold text-white">{finding.title}</h5>
                </div>
                <p className="shrink-0 rounded-lg bg-black/20 px-3 py-2 text-xs text-slate-300">
                  {finding.file}
                  {finding.line ? `:${finding.line}` : ""}
                </p>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">{finding.description}</p>
              <div className="mt-4 rounded-lg border border-white/10 bg-[#07101d] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Fix</p>
                <p className="mt-2 text-sm leading-7 text-slate-200">{finding.recommendation}</p>
              </div>
            </article>
          ))
        ) : (
          <p className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            No concrete findings were returned for the selected source excerpts.
          </p>
        )}
      </div>

      {report.nextSteps.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Next Steps</h4>
          <ul className="space-y-2">
            {report.nextSteps.map((step, index) => (
              <li key={`${step}:${index}`} className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-slate-300">
                {step}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function EmptyReportState() {
  return (
    <div className="flex h-full min-h-80 flex-col justify-center gap-3 text-slate-300">
      <p className="text-sm uppercase tracking-[0.24em] text-slate-500">No report yet</p>
      <p className="max-w-lg text-sm leading-7">
        The completed report will show repo stats, language signals, prioritized findings, file and line references, and next steps.
      </p>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: RepoReviewSeverity }) {
  const meta = getSeverityMeta(severity);
  return (
    <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function getSeverityMeta(severity: RepoReviewSeverity) {
  switch (severity) {
    case "critical":
      return { label: "Critical", className: "bg-signal-red/20 text-signal-red" };
    case "high":
      return { label: "High", className: "bg-signal-orange/20 text-signal-orange" };
    case "medium":
      return { label: "Medium", className: "bg-signal-yellow/20 text-signal-yellow" };
    case "low":
      return { label: "Low", className: "bg-signal-blue/20 text-signal-blue" };
  }
}

function toggleFocus(
  focus: string,
  selectedFocus: string[],
  setSelectedFocus: (value: string[]) => void
) {
  setSelectedFocus(
    selectedFocus.includes(focus)
      ? selectedFocus.filter((entry) => entry !== focus)
      : [...selectedFocus, focus]
  );
}

function buildFocus(selectedFocus: string[], customFocus: string) {
  return [...selectedFocus, customFocus.trim()].filter(Boolean).join(", ");
}
