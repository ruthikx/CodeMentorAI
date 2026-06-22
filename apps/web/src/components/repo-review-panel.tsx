"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch } from "../lib/api";
import type { RepoReviewCorrectedFile, RepoReviewReport, RepoReviewSeverity } from "../lib/repo-review";

const FOCUS_OPTIONS = ["bugs", "security", "performance", "architecture", "tests"] as const;
type ReviewSource = "github" | "zip";

export function RepoReviewPanel() {
  const [repoUrl, setRepoUrl] = useState("");
  const [projectZip, setProjectZip] = useState<File | null>(null);
  const [source, setSource] = useState<ReviewSource>("github");
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
  const [customFocus, setCustomFocus] = useState("");
  const [latestReport, setLatestReport] = useState<RepoReviewReport | null>(null);

  const focus = buildFocus(selectedFocus, customFocus);

  const reviewRepo = useMutation({
    mutationFn: () =>
      apiFetch<RepoReviewReport>("/api/github/repo-review", {
        method: "POST",
        body: JSON.stringify({
          url: repoUrl,
          focus: focus || undefined
        })
      }),
    onSuccess: setLatestReport
  });

  const reviewZip = useMutation({
    mutationFn: () => {
      if (!projectZip) {
        throw new Error("Choose a .zip file to review.");
      }

      const formData = new FormData();
      formData.append("project", projectZip);
      if (focus) {
        formData.append("focus", focus);
      }

      return apiFetch<RepoReviewReport>("/api/github/repo-review/upload", {
        method: "POST",
        body: formData
      });
    },
    onSuccess: setLatestReport
  });

  const isPending = reviewRepo.isPending || reviewZip.isPending;
  const activeError = source === "github" ? reviewRepo.error : reviewZip.error;

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-card">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-signal-mint">Repository Review</p>
            <h2 className="text-2xl font-semibold text-white">Review a repo or uploaded project</h2>
            <p className="text-sm leading-7 text-slate-300">
              Submit a public repository URL or upload a project zip. The API filters noisy files and reviews static excerpts only.
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (source === "github") {
                reviewRepo.mutate();
                return;
              }

              reviewZip.mutate();
            }}
          >
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-[#0b1220] p-1">
              <button
                type="button"
                onClick={() => setSource("github")}
                className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                  source === "github"
                    ? "bg-paper text-ink"
                    : "text-slate-300 hover:bg-white/10"
                }`}
                disabled={isPending}
              >
                GitHub URL
              </button>
              <button
                type="button"
                onClick={() => setSource("zip")}
                className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                  source === "zip"
                    ? "bg-paper text-ink"
                    : "text-slate-300 hover:bg-white/10"
                }`}
                disabled={isPending}
              >
                Upload Zip
              </button>
            </div>

            {source === "github" ? (
              <label className="block space-y-2 text-sm text-slate-300">
                <span>Repository URL</span>
                <input
                  value={repoUrl}
                  onChange={(event) => setRepoUrl(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#0b1220] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-signal-mint"
                  placeholder="https://github.com/owner/repo"
                  disabled={isPending}
                />
              </label>
            ) : (
              <label className="block space-y-2 text-sm text-slate-300">
                <span>Project zip</span>
                <input
                  type="file"
                  accept=".zip,application/zip,application/x-zip-compressed"
                  onChange={(event) => setProjectZip(event.target.files?.[0] ?? null)}
                  className="w-full rounded-lg border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-slate-300 outline-none transition file:mr-4 file:rounded-md file:border-0 file:bg-paper file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:bg-white focus:border-signal-mint"
                  disabled={isPending}
                />
              </label>
            )}

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
                      disabled={isPending}
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
                disabled={isPending}
              />
            </label>

            <button
              type="submit"
              disabled={isPending || (source === "github" ? repoUrl.trim().length === 0 : !projectZip)}
              className="w-full rounded-lg bg-paper px-5 py-3 font-medium text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isPending
                ? "Reviewing Project..."
                : source === "github"
                  ? "Review GitHub Repo"
                  : "Review Uploaded Zip"}
            </button>
          </form>

          {isPending ? (
            <div className="rounded-lg border border-signal-mint/30 bg-signal-mint/10 px-4 py-3 text-sm text-signal-mint">
              Selecting source files, generating the review report, and preparing downloadable fixes.
            </div>
          ) : null}

          {activeError ? (
            <div className="rounded-lg border border-signal-red/30 bg-signal-red/10 px-4 py-3 text-sm text-signal-red">
              {activeError.message}
            </div>
          ) : null}
        </div>

        <div className="min-h-96 rounded-lg border border-white/10 bg-[#0b1220] p-5">
          {latestReport ? <RepoReviewReportView report={latestReport} /> : <EmptyReportState />}
        </div>
      </div>
    </section>
  );
}

function RepoReviewReportView({ report }: { report: RepoReviewReport }) {
  const hasAggregatePatch = Boolean(report.fixes?.patch);
  const correctedFiles = report.fixes?.correctedFiles ?? [];
  const artifact = report.artifact;

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

      {hasAggregatePatch || correctedFiles.length > 0 || artifact ? (
        <div className="rounded-lg border border-signal-mint/30 bg-signal-mint/10 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-signal-mint">Fix Downloads</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                Download a patch, corrected file snapshots, or the reviewed zip with validated fixes and a report included.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {artifact ? (
                <button
                  type="button"
                  onClick={() => downloadBase64File(artifact.filename, artifact.base64, artifact.mimeType)}
                  className="rounded-lg bg-paper px-3 py-2 text-sm font-medium text-ink transition hover:bg-white"
                >
                  Download Corrected Zip
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => downloadText(buildRepoDownloadName(report.repo.name, "repo-review.patch"), report.fixes?.patch ?? "")}
                disabled={!hasAggregatePatch}
                className="rounded-lg bg-paper px-3 py-2 text-sm font-medium text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Download Patch
              </button>
              {correctedFiles.length === 1 ? (
                <button
                  type="button"
                  onClick={() => downloadCorrectedFile(correctedFiles[0], "corrected-")}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
                >
                  Download File
                </button>
              ) : null}
            </div>
          </div>
          {correctedFiles.length > 1 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {correctedFiles.map((file) => (
                <button
                  key={file.file}
                  type="button"
                  onClick={() => downloadCorrectedFile(file, "corrected-")}
                  className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-200 transition hover:bg-white/10"
                >
                  {file.file}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Fix</p>
                    <p className="mt-2 text-sm leading-7 text-slate-200">{finding.recommendation}</p>
                  </div>
                  {finding.fix ? (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => downloadText(buildFindingDownloadName(finding.file, index, "patch"), finding.fix?.patch ?? "")}
                        disabled={!finding.fix.patch}
                        className="rounded-lg bg-paper px-3 py-2 text-xs font-medium text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Patch
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (finding.fix?.correctedFile) {
                            downloadCorrectedFile(finding.fix.correctedFile, "corrected-");
                          }
                        }}
                        disabled={!finding.fix.correctedFile}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        File
                      </button>
                    </div>
                  ) : null}
                </div>
                {finding.fix?.patch ? (
                  <pre className="mt-3 max-h-72 overflow-auto rounded-lg border border-white/10 bg-black/30 p-3 text-xs leading-5 text-slate-200">
                    <code>{finding.fix.patch}</code>
                  </pre>
                ) : (
                  <p className="mt-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs leading-5 text-slate-400">
                    No safe downloadable patch was generated for this finding. The recommendation may need broader context, a dependency change, or a manual edit.
                  </p>
                )}
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

function downloadText(filename: string, content: string) {
  if (content.length === 0) {
    return;
  }

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadBase64File(filename: string, base64: string, mimeType: string) {
  if (base64.length === 0) {
    return;
  }

  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = sanitizeDownloadName(filename);
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadCorrectedFile(file: RepoReviewCorrectedFile | undefined, prefix = "") {
  if (!file) {
    return;
  }

  downloadText(`${prefix}${sanitizeDownloadName(file.file)}`, file.content);
}

function buildRepoDownloadName(repoName: string, suffix: string) {
  return `${sanitizeDownloadName(repoName)}-${suffix}`;
}

function buildFindingDownloadName(filePath: string, index: number, extension: string) {
  return `${sanitizeDownloadName(filePath)}-fix-${index + 1}.${extension}`;
}

function sanitizeDownloadName(value: string) {
  return value
    .replace(/^[a-z]:/iu, "")
    .replace(/[\\/]+/g, "-")
    .replace(/[^a-z0-9._-]+/giu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    || "repo-review";
}
