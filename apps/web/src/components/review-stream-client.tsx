"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Code2,
  Copy,
  Download,
  GitPullRequest,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Terminal,
  type LucideIcon
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../lib/api";
import { applyAcceptedFixes, type AppliedFixResult, type ReviewDetail, type ReviewIssue } from "../lib/review";
import { streamReviewIssues } from "../lib/review-stream";
import { IssueCard } from "./issue-card";
import { Spotlight } from "./ui/spotlight";

type IssueDecision = "accepted" | "rejected";

export function ReviewStreamClient({ reviewId }: { reviewId: string }) {
  const [streamedIssues, setStreamedIssues] = useState<ReviewIssue[]>([]);
  const [status, setStatus] = useState<ReviewDetail["status"]>("processing");
  const [streamError, setStreamError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Record<string, IssueDecision>>({});
  const [generatedCode, setGeneratedCode] = useState<AppliedFixResult | null>(null);
  const [githubActionMessage, setGitHubActionMessage] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const issueRefs = useRef<Array<HTMLDivElement | null>>([]);

  const reviewQuery = useQuery({
    queryKey: ["review", reviewId],
    queryFn: () => apiFetch<ReviewDetail>(`/api/reviews/${reviewId}`)
  });

  useEffect(() => {
    if (!reviewQuery.data) {
      return;
    }

    setStreamedIssues(reviewQuery.data.issues);
    setDecisions((current) => {
      const next = { ...current };
      for (const issue of reviewQuery.data.issues) {
        if (issue.accepted) {
          next[issue.id] = "accepted";
        }
      }

      return next;
    });
    setStatus(reviewQuery.data.status);
    if (reviewQuery.data.status === "complete") {
      setStreamError(null);
    }
  }, [reviewQuery.data]);

  useEffect(() => {
    const controller = new AbortController();

    void streamReviewIssues({
      reviewId,
      signal: controller.signal,
      onStatus: (nextStatus) => {
        setStatus(nextStatus as ReviewDetail["status"]);
        if (nextStatus === "complete") {
          setStreamError(null);
        }
      },
      onIssue: (payload) => {
        setStreamedIssues((current) =>
          current.some((issue) => issue.id === payload.id) ? current : [...current, payload]
        );
      },
      onComplete: () => {
        setStatus("complete");
        setStreamError(null);
      },
      onUnexpectedClose: () =>
        setStreamError("The live review stream disconnected before completion. Fetch saved issues to recover progress."),
      onError: () => setStatus("failed")
    }).catch(() => {
      if (!controller.signal.aborted) {
        setStreamError("The live review stream disconnected before completion. Fetch saved issues to recover progress.");
      }
    });

    return () => controller.abort();
  }, [reviewId]);

  const patchIssue = useMutation({
    mutationFn: (params: { issueId: string; accepted: boolean }) =>
      apiFetch<{ updated: boolean }>(`/api/reviews/${reviewId}/issues/${params.issueId}`, {
        method: "PATCH",
        body: JSON.stringify({ accepted: params.accepted })
      }),
    onMutate: () => {
      setActionError(null);
    },
    onSuccess: (_payload, variables) => {
      setStreamedIssues((current) =>
        current.map((issue) =>
          issue.id === variables.issueId ? { ...issue, accepted: variables.accepted } : issue
        )
      );
      setGeneratedCode(null);
      setDecisions((current) => ({
        ...current,
        [variables.issueId]: variables.accepted ? "accepted" : "rejected"
      }));
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : String(error);
      console.log("[review-stream] Failed to update issue decision.", {
        reviewId,
        message
      });
      setActionError(message);
    }
  });

  const orderedIssues = useMemo(
    () => [...streamedIssues].sort((left, right) => left.lineStart - right.lineStart),
    [streamedIssues]
  );
  const acceptedIssueCount = orderedIssues.filter((issue) => decisions[issue.id] === "accepted").length;
  const undecidedIssueCount = orderedIssues.filter((issue) => !decisions[issue.id]).length;
  const allIssuesDecided = orderedIssues.length > 0 && undecidedIssueCount === 0;
  const fallbackFinalCode = useMemo(
    () => applyAcceptedFixes(reviewQuery.data?.submission.sourceCode ?? "", orderedIssues.filter((issue) => decisions[issue.id] === "accepted")),
    [decisions, orderedIssues, reviewQuery.data?.submission.sourceCode]
  );

  const generateFinalCode = useMutation({
    mutationFn: () =>
      apiFetch<{ code: string; providerUsed: string; modelUsed: string }>(`/api/reviews/${reviewId}/final-code`, {
        method: "POST"
      }),
    onMutate: () => {
      setActionError(null);
    },
    onSuccess: (payload) => {
      setGeneratedCode({
        code: payload.code,
        appliedCount: acceptedIssueCount,
        skippedIssues: []
      });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : String(error);
      console.log("[review-stream] Final code generation failed.", {
        reviewId,
        message
      });
      setActionError(`${message} Showing line-based fallback when possible.`);
      if (fallbackFinalCode.appliedCount > 0) {
        setGeneratedCode(fallbackFinalCode);
      }
    }
  });

  const postGitHubComment = useMutation({
    mutationFn: () =>
      apiFetch<{ commented: boolean }>(`/api/reviews/${reviewId}/github/comment`, {
        method: "POST",
        body: JSON.stringify({
          body: buildGitHubReviewComment({
            filename: reviewQuery.data?.submission.filename,
            issues: orderedIssues,
            decisions
          })
        })
      }),
    onMutate: () => {
      setActionError(null);
      setGitHubActionMessage(null);
    },
    onSuccess: () => {
      setGitHubActionMessage("Comment added to the pull request.");
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : String(error));
    }
  });

  const mergeGitHubPullRequest = useMutation({
    mutationFn: () => apiFetch<{ merged: boolean; message: string }>(`/api/reviews/${reviewId}/github/merge`, {
      method: "POST"
    }),
    onMutate: () => {
      setActionError(null);
      setGitHubActionMessage(null);
    },
    onSuccess: (payload) => {
      setGitHubActionMessage(payload.message);
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : String(error));
    }
  });

  useEffect(() => {
    if (activeIndex >= orderedIssues.length && orderedIssues.length > 0) {
      setActiveIndex(orderedIssues.length - 1);
    }
  }, [activeIndex, orderedIssues.length]);

  if (reviewQuery.isLoading) {
    return <ReviewShell message="Loading review context..." />;
  }

  if (reviewQuery.error || !reviewQuery.data) {
    return <ReviewShell message={reviewQuery.error?.message ?? "Review not found."} />;
  }

  const handleNavigation = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (orderedIssues.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = Math.min(activeIndex + 1, orderedIssues.length - 1);
      setActiveIndex(nextIndex);
      issueRefs.current[nextIndex]?.focus();
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex = Math.max(activeIndex - 1, 0);
      setActiveIndex(nextIndex);
      issueRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] px-6 py-12 font-sans text-white selection:bg-blue-500/30 lg:px-10">
      <div className="pointer-events-none absolute left-1/4 top-24 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f14_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f14_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_70%_45%_at_50%_0%,#000_55%,transparent_100%)]" />

      <main className="relative z-10 mx-auto flex max-w-[1400px] flex-col gap-8">
        <header className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-end">
          <div className="flex min-w-0 flex-col items-start gap-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-gradient-to-r from-white/[0.08] to-white/[0.02] px-3 py-1.5 text-sm font-medium text-neutral-300 shadow-[0_0_15px_rgba(255,255,255,0.03)] backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              Streaming Review
            </div>
            <div className="space-y-4">
              <h1 className="max-w-4xl bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-[2.5rem] font-bold leading-[1.08] tracking-normal text-transparent sm:text-5xl lg:text-6xl">
                {reviewQuery.data.submission.filename ?? "Untitled submission"}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-neutral-400 sm:text-lg">
                {reviewQuery.data.submission.language} review - {status}
              </p>
            </div>
          </div>

          <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 shadow-2xl backdrop-blur-md sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <ReviewStat icon={Code2} label="Issues" value={String(orderedIssues.length)} />
            <ReviewStat icon={CheckCircle2} label="Accepted" value={String(acceptedIssueCount)} />
            <ReviewStat icon={Sparkles} label="Open" value={String(undecidedIssueCount)} />
          </div>
        </header>

        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#070707] shadow-2xl">
          <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="white" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

          <div className="relative z-10">
            <div className="flex flex-col gap-4 border-b border-white/10 bg-[#0d0d0f] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-500/80" />
                  <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <span className="h-3 w-3 rounded-full bg-green-500/80" />
                </div>
                <span className="min-w-0 truncate font-mono text-xs text-neutral-400">
                  review/{reviewId} - CodeMentor Stream
                </span>
              </div>
              <a
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-[0_0_20px_rgba(255,255,255,0.12)] transition-all duration-300 hover:scale-[1.02] hover:bg-neutral-100 hover:shadow-[0_0_30px_rgba(255,255,255,0.22)] sm:w-auto"
                href={`/review/${reviewId}/chat`}
              >
                <MessageSquare className="h-4 w-4 text-black" />
                Open Review Chat
              </a>
            </div>

            <div className="space-y-6 p-5 lg:p-8">
              <section className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                    <CheckCircle2 className="h-5 w-5 text-blue-400" />
                  </div>
                  <p className="text-sm leading-7 text-neutral-300">
                    {streamError
                      ? "The SSE connection is no longer live, but saved issues can still be fetched from the review API."
                      : status === "processing"
                      ? "The SSE stream is active. Issues will appear as soon as the model completes each structured JSON object."
                      : status === "failed"
                        ? "The review failed before completion."
                        : "The review stream is complete."}
                  </p>
                </div>
              </section>

              {streamError ? (
                <section className="flex flex-col gap-4 rounded-3xl border border-yellow-500/25 bg-yellow-500/10 p-5 text-sm text-neutral-100 md:flex-row md:items-center md:justify-between">
                  <p className="leading-7">{streamError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      void reviewQuery.refetch();
                    }}
                    disabled={reviewQuery.isFetching}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-5 py-3 font-medium text-yellow-300 transition hover:bg-yellow-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${reviewQuery.isFetching ? "animate-spin" : ""}`} />
                    {reviewQuery.isFetching ? "Fetching Issues..." : "Fetch Saved Issues"}
                  </button>
                </section>
              ) : null}

              {actionError ? (
                <section className="flex items-start gap-3 rounded-3xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-100">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-300" />
                  <span>Could not update this issue: {actionError}</span>
                </section>
              ) : null}

              {reviewQuery.data.submission.githubPrId ? (
                <GitHubReviewActions
                  repoLabel={reviewQuery.data.submission.filename ?? "GitHub pull request"}
                  prNumber={reviewQuery.data.submission.githubPrId}
                  status={status}
                  isCommenting={postGitHubComment.isPending}
                  isMerging={mergeGitHubPullRequest.isPending}
                  message={githubActionMessage}
                  onComment={() => postGitHubComment.mutate()}
                  onMerge={() => mergeGitHubPullRequest.mutate()}
                />
              ) : null}

              <div role="listbox" aria-label="Review issues" className="grid gap-5" onKeyDown={handleNavigation}>
                {orderedIssues.map((issue, index) => (
                  <div
                    key={issue.id}
                    ref={(node) => {
                      issueRefs.current[index] = node;
                    }}
                    tabIndex={-1}
                  >
                    <IssueCard
                      issue={issue}
                      sourceCode={reviewQuery.data.submission.sourceCode}
                      language={reviewQuery.data.submission.language}
                      active={index === activeIndex}
                      isSaving={patchIssue.isPending && patchIssue.variables?.issueId === issue.id}
                      decision={decisions[issue.id]}
                      onFocus={() => setActiveIndex(index)}
                      onAccept={(accepted) => patchIssue.mutate({ issueId: issue.id, accepted })}
                    />
                  </div>
                ))}
              </div>

              {orderedIssues.length === 0 && status === "processing" ? (
                <InlineReviewState message="Waiting for the first issue to arrive..." />
              ) : null}

              {orderedIssues.length > 0 ? (
                <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-sm text-neutral-300 backdrop-blur-md">
                  {allIssuesDecided
                    ? acceptedIssueCount > 0
                      ? "All issues have a decision. Generate the final corrected code from the accepted fixes."
                      : "All issues were rejected, so there is no corrected code to generate."
                    : `${undecidedIssueCount} ${undecidedIssueCount === 1 ? "issue still needs" : "issues still need"} Accept Fix or Reject before final code is generated.`}
                </section>
              ) : null}

              {allIssuesDecided && acceptedIssueCount > 0 ? (
                <FinalCodePanel
                  result={generatedCode}
                  filename={reviewQuery.data.submission.filename}
                  language={reviewQuery.data.submission.language}
                  isGenerating={generateFinalCode.isPending}
                  onGenerate={() => generateFinalCode.mutate()}
                />
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function ReviewStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
        <Icon className="h-4 w-4 text-blue-400" />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function InlineReviewState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-neutral-400">
      <Terminal className="h-5 w-5 flex-shrink-0 text-blue-400" />
      <span>{message}</span>
    </div>
  );
}

function GitHubReviewActions(props: {
  repoLabel: string;
  prNumber: number;
  status: ReviewDetail["status"];
  isCommenting: boolean;
  isMerging: boolean;
  message: string | null;
  onComment: () => void;
  onMerge: () => void;
}) {
  const disabled = props.status === "processing" || props.status === "pending";

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl backdrop-blur-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
            <GitPullRequest className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">GitHub Pull Request</p>
            <h2 className="mt-2 text-xl font-semibold text-white">{props.repoLabel}</h2>
            <p className="mt-1 text-sm text-neutral-400">PR #{props.prNumber}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={props.onComment}
            disabled={disabled || props.isCommenting}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MessageSquare className="h-4 w-4" />
            {props.isCommenting ? "Adding Comment..." : "Add Review Comment"}
          </button>
          <button
            type="button"
            onClick={props.onMerge}
            disabled={disabled || props.isMerging}
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black shadow-[0_0_20px_rgba(255,255,255,0.12)] transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {props.isMerging ? "Merging..." : "Merge Pull Request"}
          </button>
        </div>
      </div>
      {disabled ? (
        <p className="mt-4 text-sm text-neutral-500">GitHub actions unlock when the review finishes.</p>
      ) : null}
      {props.message ? (
        <p className="mt-4 rounded-2xl border border-blue-500/25 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
          {props.message}
        </p>
      ) : null}
    </section>
  );
}

function buildGitHubReviewComment(params: {
  filename: string | null | undefined;
  issues: ReviewIssue[];
  decisions: Record<string, IssueDecision>;
}): string {
  const acceptedIssues = params.issues.filter((issue) => params.decisions[issue.id] === "accepted");
  const rejectedCount = params.issues.filter((issue) => params.decisions[issue.id] === "rejected").length;
  const lines = [
    "## CodeMentor AI Review",
    "",
    `Review target: ${params.filename ?? "GitHub pull request"}`,
    `Total issues found: ${params.issues.length}`,
    `Accepted fixes: ${acceptedIssues.length}`,
    `Rejected issues: ${rejectedCount}`,
    ""
  ];

  if (acceptedIssues.length > 0) {
    lines.push("### Accepted fixes");
    for (const issue of acceptedIssues) {
      lines.push(`- Lines ${issue.lineStart}-${issue.lineEnd}: ${issue.title}`);
    }
  } else {
    lines.push("No fixes were accepted from this review.");
  }

  return lines.join("\n");
}

function FinalCodePanel(props: {
  result: AppliedFixResult | null;
  filename: string | null;
  language: string;
  isGenerating: boolean;
  onGenerate: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const downloadFilename = props.filename ? `corrected-${props.filename}` : "corrected-code.txt";
  const result = props.result;

  const copyCode = async () => {
    if (!result) {
      return;
    }

    await navigator.clipboard.writeText(result.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const downloadCode = () => {
    if (!result) {
      return;
    }

    const blob = new Blob([result.code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = downloadFilename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#0b0b0c] p-5 shadow-2xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
            <Code2 className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">Final Corrected Code</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{downloadFilename}</h2>
            <p className="mt-2 text-sm text-neutral-400">
              {result
                ? `Generated from ${result.appliedCount} accepted ${result.appliedCount === 1 ? "fix" : "fixes"}.`
                : "Ready to generate from accepted fixes."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={props.onGenerate}
            disabled={props.isGenerating}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 text-black ${props.isGenerating ? "animate-spin" : ""}`} />
            {props.isGenerating ? "Generating..." : result ? "Regenerate" : "Generate Final Code"}
          </button>
          <button
            type="button"
            onClick={() => {
              void copyCode();
            }}
            disabled={!result}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Copy className="h-4 w-4" />
            {copied ? "Copied" : "Copy Code"}
          </button>
          <button
            type="button"
            onClick={downloadCode}
            disabled={!result}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>
      </div>

      {!result ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-neutral-400">
          This step asks the AI to produce a complete corrected file from the accepted issues, so fragmentary suggested fixes do not get pasted directly into the source.
        </div>
      ) : null}

      {result?.skippedIssues.length ? (
        <div className="mt-4 rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-4 text-sm text-yellow-100">
          {result.skippedIssues.length} accepted {result.skippedIssues.length === 1 ? "fix was" : "fixes were"} skipped by the fallback line-based patcher because line ranges overlapped or no longer matched the source.
        </div>
      ) : null}

      {result ? (
        <pre className="mt-5 max-h-[520px] overflow-auto rounded-2xl border border-white/10 bg-[#09090a] p-4 text-sm leading-6 text-neutral-200">
          <code className={`language-${props.language}`}>{result.code}</code>
        </pre>
      ) : null}
    </section>
  );
}

function ReviewShell({ message }: { message: string }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] px-6 py-12 font-sans text-white selection:bg-blue-500/30 lg:px-10">
      <div className="pointer-events-none absolute left-1/4 top-24 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/10 blur-[120px]" />
      <main className="relative z-10 mx-auto max-w-[1400px]">
        <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-neutral-300 shadow-2xl backdrop-blur-md">
          <Sparkles className="h-5 w-5 flex-shrink-0 text-blue-400" />
          <span>{message}</span>
        </div>
      </main>
    </div>
  );
}
