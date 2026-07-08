"use client";

import { useMutation } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  CheckCircle,
  Download,
  FileArchive,
  FileCode2,
  Github,
  Loader2,
  Play,
  Sparkles,
  Terminal,
  Upload
} from "lucide-react";
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
    <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#070707] p-4 shadow-2xl lg:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="relative z-10 grid gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-6 rounded-3xl border border-white/5 bg-white/[0.01] p-6 shadow-xl backdrop-blur-xl lg:col-span-5 lg:p-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-400">
              <Sparkles className="h-4 w-4" />
              Repository Review
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Review a repo or uploaded project</h2>
            <p className="text-sm leading-7 text-neutral-400">
              Submit a public repository URL or upload a project zip. The API filters noisy files and reviews static excerpts only.
            </p>
          </div>

          <form
            className="flex flex-col gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (source === "github") {
                reviewRepo.mutate();
                return;
              }

              reviewZip.mutate();
            }}
          >
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black p-1">
              <button
                type="button"
                onClick={() => setSource("github")}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  source === "github"
                    ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.12)]"
                    : "text-neutral-300 hover:bg-white/10 hover:text-white"
                }`}
                disabled={isPending}
              >
                <Github className="h-4 w-4" />
                GitHub URL
              </button>
              <button
                type="button"
                onClick={() => setSource("zip")}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  source === "zip"
                    ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.12)]"
                    : "text-neutral-300 hover:bg-white/10 hover:text-white"
                }`}
                disabled={isPending}
              >
                <Upload className="h-4 w-4" />
                Upload Zip
              </button>
            </div>

            {source === "github" ? (
              <label className="block space-y-2 text-sm text-neutral-300">
                <span className="flex items-center gap-2 font-medium">
                  <Github className="h-4 w-4 text-neutral-500" />
                  GitHub Repository Link
                </span>
                <div className="relative">
                  <input
                    value={repoUrl}
                    onChange={(event) => setRepoUrl(event.target.value)}
                    className="w-full rounded-xl border border-white/5 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-neutral-600 hover:border-white/10 focus:border-blue-500/50"
                    placeholder="https://github.com/owner/repo"
                    disabled={isPending}
                  />
                </div>
              </label>
            ) : (
              <label className="block space-y-2 text-sm text-neutral-300">
                <span className="flex items-center gap-2 font-medium">
                  <FileArchive className="h-4 w-4 text-neutral-500" />
                  Project Zip
                </span>
                <div className="rounded-xl border border-dashed border-white/10 bg-black/60 p-4 transition hover:border-blue-500/30 hover:bg-black">
                  <input
                    type="file"
                    accept=".zip,application/zip,application/x-zip-compressed"
                    onChange={(event) => setProjectZip(event.target.files?.[0] ?? null)}
                    className="w-full text-sm text-neutral-300 outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-black hover:file:bg-neutral-100"
                    disabled={isPending}
                  />
                </div>
              </label>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-300">Focus</p>
              <div className="flex flex-wrap gap-2">
                {FOCUS_OPTIONS.map((focus) => {
                  const active = selectedFocus.includes(focus);

                  return (
                    <button
                      key={focus}
                      type="button"
                      onClick={() => toggleFocus(focus, selectedFocus, setSelectedFocus)}
                      className={`rounded-xl border px-3 py-2 text-sm capitalize transition ${
                        active
                          ? "border-blue-500/40 bg-blue-500/10 text-blue-300 shadow-[0_0_18px_rgba(59,130,246,0.08)]"
                          : "border-white/10 bg-black text-neutral-300 hover:border-white/25 hover:bg-white/5"
                      }`}
                      disabled={isPending}
                    >
                      {focus}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="block space-y-2 text-sm text-neutral-300">
              <span className="font-medium">Optional Notes</span>
              <textarea
                value={customFocus}
                onChange={(event) => setCustomFocus(event.target.value)}
                className="min-h-24 w-full resize-y rounded-xl border border-white/5 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-neutral-600 hover:border-white/10 focus:border-blue-500/50"
                placeholder="Prioritize auth, data validation, or test coverage."
                maxLength={500}
                disabled={isPending}
              />
            </label>

            <button
              type="submit"
              disabled={isPending || (source === "github" ? repoUrl.trim().length === 0 : !projectZip)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300 hover:bg-neutral-200 hover:shadow-[0_0_30px_rgba(255,255,255,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Reviewing Project...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  {source === "github" ? "Review GitHub Repo" : "Review Uploaded Zip"}
                </>
              )}
            </button>
          </form>

          {isPending ? (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-300">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Selecting source files, generating the review report, and preparing downloadable fixes.
              </div>
            </div>
          ) : null}

          {activeError ? (
            <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{activeError.message}</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="min-h-[520px] rounded-3xl border border-white/5 bg-white/[0.01] p-4 lg:col-span-7 lg:p-6">
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
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b0c] shadow-2xl">
      <div className="flex flex-col gap-4 border-b border-white/10 bg-[#0d0d0f] px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-lg font-bold text-white">
            <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
            <span className="truncate">{report.repo.name}</span>
          </h3>
          <p className="mt-1 text-xs text-neutral-500">
            Audited {report.stats.filesScanned} source files on {report.repo.defaultBranch}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {artifact ? (
            <button
              type="button"
              onClick={() => downloadBase64File(artifact.filename, artifact.base64, artifact.mimeType)}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-black transition hover:bg-neutral-200"
            >
              <Download className="h-3.5 w-3.5" />
              Zip
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => downloadText(buildRepoDownloadName(report.repo.name, "repo-review.patch"), report.fixes?.patch ?? "")}
            disabled={!hasAggregatePatch}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Patch
          </button>
          {correctedFiles.length === 1 ? (
            <button
              type="button"
              onClick={() => downloadCorrectedFile(correctedFiles[0], "corrected-")}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
            >
              <FileCode2 className="h-3.5 w-3.5" />
              File
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-6 p-5">
        <p className="text-sm leading-7 text-neutral-400">{report.summary}</p>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Branch</span>
            <span className="block truncate text-sm font-semibold text-white">{report.repo.defaultBranch}</span>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Files Scanned</span>
            <span className="text-sm font-semibold text-white">{report.stats.filesScanned} Files</span>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Findings</span>
            <span className="text-sm font-semibold text-red-400">{report.findings.length} Alerts</span>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Languages</span>
            <span className="block truncate text-sm font-semibold text-green-400">
              {report.stats.languages.length > 0 ? report.stats.languages.join(", ") : "N/A"}
            </span>
          </div>
        </div>

        {hasAggregatePatch || correctedFiles.length > 0 || artifact ? (
          <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-green-400">
              <Check className="h-3.5 w-3.5" />
              Fix Downloads
            </p>
            <p className="mt-2 text-sm leading-6 text-neutral-300">
              Download a patch, corrected file snapshots, or the reviewed zip with validated fixes and a report included.
            </p>
            {correctedFiles.length > 1 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {correctedFiles.map((file) => (
                  <button
                    key={file.file}
                    type="button"
                    onClick={() => downloadCorrectedFile(file, "corrected-")}
                    className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-neutral-200 transition hover:bg-white/10"
                  >
                    {file.file}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-4">
          <span className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
            Scanned Findings & Recommendations
          </span>
          {report.findings.length > 0 ? (
            report.findings.map((finding, index) => {
              const tone = getSeverityTone(finding.severity);

              return (
                <article
                  key={`${finding.file}:${finding.line ?? "repo"}:${finding.title}:${index}`}
                  className={`rounded-xl border p-4 ${tone.cardClassName}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-2">
                      <SeverityBadge severity={finding.severity} />
                      <h5 className="text-base font-semibold text-white">{finding.title}</h5>
                    </div>
                    <p className="shrink-0 rounded-lg bg-black/30 px-3 py-2 font-mono text-xs text-neutral-300">
                      {finding.file}
                      {finding.line ? `:${finding.line}` : ""}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-neutral-400">{finding.description}</p>
                  <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Fix</p>
                        <p className="mt-2 text-sm leading-7 text-neutral-200">{finding.recommendation}</p>
                      </div>
                      {finding.fix ? (
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => downloadText(buildFindingDownloadName(finding.file, index, "patch"), finding.fix?.patch ?? "")}
                            disabled={!finding.fix.patch}
                            className="rounded-lg bg-white px-3 py-2 text-xs font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
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
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            File
                          </button>
                        </div>
                      ) : null}
                    </div>
                    {finding.fix?.patch ? (
                      <pre className="mt-3 max-h-72 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 text-xs leading-5 text-neutral-200">
                        <code>{finding.fix.patch}</code>
                      </pre>
                    ) : (
                      <p className="mt-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs leading-5 text-neutral-500">
                        No safe downloadable patch was generated for this finding. The recommendation may need broader context, a dependency change, or a manual edit.
                      </p>
                    )}
                  </div>
                </article>
              );
            })
          ) : (
            <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-neutral-300">
              No concrete findings were returned for the selected source excerpts.
            </p>
          )}
        </div>

        {report.nextSteps.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Next Steps</h4>
            <ul className="space-y-2">
              {report.nextSteps.map((step, index) => (
                <li key={`${step}:${index}`} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-neutral-300">
                  {step}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EmptyReportState() {
  return (
    <div className="flex h-full min-h-[480px] flex-col items-center justify-center gap-4 rounded-3xl border border-white/5 bg-white/[0.01] p-10 text-center">
      <Terminal className="h-12 w-12 text-neutral-700" />
      <h3 className="text-xl font-semibold text-neutral-300">Live Report Preview</h3>
      <p className="max-w-sm text-sm leading-7 text-neutral-500">
        Submit your public link or zip project to trigger your real-time teaching feedback report.
      </p>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: RepoReviewSeverity }) {
  const tone = getSeverityTone(severity);
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-bold uppercase ${tone.badgeClassName}`}>
      {tone.label} Severity
    </span>
  );
}

function getSeverityTone(severity: RepoReviewSeverity) {
  switch (severity) {
    case "critical":
      return {
        label: "Critical",
        badgeClassName: "border border-red-400/20 bg-red-400/10 text-red-400",
        cardClassName: "border-red-500/10 bg-red-500/[0.02]"
      };
    case "high":
      return {
        label: "High",
        badgeClassName: "border border-orange-400/20 bg-orange-400/10 text-orange-400",
        cardClassName: "border-orange-500/10 bg-orange-500/[0.02]"
      };
    case "medium":
      return {
        label: "Medium",
        badgeClassName: "border border-yellow-400/20 bg-yellow-400/10 text-yellow-400",
        cardClassName: "border-yellow-500/10 bg-yellow-500/[0.02]"
      };
    case "low":
      return {
        label: "Low",
        badgeClassName: "border border-blue-400/20 bg-blue-400/10 text-blue-400",
        cardClassName: "border-blue-500/10 bg-blue-500/[0.02]"
      };
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
