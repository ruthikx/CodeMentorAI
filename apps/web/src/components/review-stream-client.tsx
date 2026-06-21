"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../lib/api";
import { applyAcceptedFixes, type AppliedFixResult, type ReviewDetail, type ReviewIssue } from "../lib/review";
import { streamReviewIssues } from "../lib/review-stream";
import { IssueCard } from "./issue-card";

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
    <div className="min-h-screen bg-[linear-gradient(180deg,_#09111f_0%,_#101c30_100%)] px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="space-y-4">
          <p className="text-sm uppercase tracking-[0.32em] text-signal.mint">Streaming Review</p>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold text-white">
                {reviewQuery.data.submission.filename ?? "Untitled submission"}
              </h1>
              <p className="text-sm text-slate-300">
                {reviewQuery.data.submission.language} - status: {status}
              </p>
            </div>
            <a
              className="inline-flex rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-100 transition hover:bg-white/10"
              href={`/review/${reviewId}/chat`}
            >
              Open Review Chat
            </a>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-slate-300">
          {streamError
            ? "The SSE connection is no longer live, but saved issues can still be fetched from the review API."
            : status === "processing"
            ? "The SSE stream is active. Issues will appear as soon as the model completes each structured JSON object."
            : status === "failed"
              ? "The review failed before completion."
              : "The review stream is complete."}
        </section>

        {streamError ? (
          <section className="flex flex-col gap-4 rounded-3xl border border-signal.yellow/30 bg-signal.yellow/10 p-5 text-sm text-slate-100 md:flex-row md:items-center md:justify-between">
            <p className="leading-7">{streamError}</p>
            <button
              type="button"
              onClick={() => {
                void reviewQuery.refetch();
              }}
              disabled={reviewQuery.isFetching}
              className="rounded-full border border-signal.yellow/40 bg-signal.yellow/15 px-5 py-3 font-medium text-signal.yellow transition hover:bg-signal.yellow/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {reviewQuery.isFetching ? "Fetching Issues..." : "Fetch Saved Issues"}
            </button>
          </section>
        ) : null}

        {actionError ? (
          <section className="rounded-3xl border border-signal.red/30 bg-signal.red/10 p-5 text-sm text-slate-100">
            Could not update this issue: {actionError}
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
          <ReviewShell message="Waiting for the first issue to arrive..." />
        ) : null}

        {orderedIssues.length > 0 ? (
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-300">
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
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-signal.mint">GitHub Pull Request</p>
          <h2 className="mt-2 text-xl font-semibold text-white">{props.repoLabel}</h2>
          <p className="mt-1 text-sm text-slate-300">PR #{props.prNumber}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={props.onComment}
            disabled={disabled || props.isCommenting}
            className="rounded-full border border-signal.mint/40 bg-signal.mint/10 px-5 py-3 text-sm font-medium text-signal.mint transition hover:bg-signal.mint/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {props.isCommenting ? "Adding Comment..." : "Add Review Comment"}
          </button>
          <button
            type="button"
            onClick={props.onMerge}
            disabled={disabled || props.isMerging}
            className="rounded-full bg-paper px-5 py-3 text-sm font-medium text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {props.isMerging ? "Merging..." : "Merge Pull Request"}
          </button>
        </div>
      </div>
      {disabled ? (
        <p className="mt-4 text-sm text-slate-400">GitHub actions unlock when the review finishes.</p>
      ) : null}
      {props.message ? (
        <p className="mt-4 rounded-2xl border border-signal.mint/30 bg-signal.mint/10 px-4 py-3 text-sm text-signal.mint">
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
    <section className="rounded-3xl border border-signal.mint/30 bg-[#0b1220] p-5 shadow-card">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-signal.mint">Final Corrected Code</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{downloadFilename}</h2>
          <p className="mt-2 text-sm text-slate-300">
            {result
              ? `Generated from ${result.appliedCount} accepted ${result.appliedCount === 1 ? "fix" : "fixes"}.`
              : "Ready to generate from accepted fixes."}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={props.onGenerate}
            disabled={props.isGenerating}
            className="rounded-full border border-signal.mint/40 bg-signal.mint/10 px-4 py-2 text-sm font-medium text-signal.mint transition hover:bg-signal.mint/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {props.isGenerating ? "Generating..." : result ? "Regenerate" : "Generate Final Code"}
          </button>
          <button
            type="button"
            onClick={() => {
              void copyCode();
            }}
            disabled={!result}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {copied ? "Copied" : "Copy Code"}
          </button>
          <button
            type="button"
            onClick={downloadCode}
            disabled={!result}
            className="rounded-full bg-paper px-4 py-2 text-sm font-medium text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Download
          </button>
        </div>
      </div>

      {!result ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-300">
          This step asks the AI to produce a complete corrected file from the accepted issues, so fragmentary suggested fixes do not get pasted directly into the source.
        </div>
      ) : null}

      {result?.skippedIssues.length ? (
        <div className="mt-4 rounded-2xl border border-signal.yellow/30 bg-signal.yellow/10 p-4 text-sm text-slate-100">
          {result.skippedIssues.length} accepted {result.skippedIssues.length === 1 ? "fix was" : "fixes were"} skipped by the fallback line-based patcher because line ranges overlapped or no longer matched the source.
        </div>
      ) : null}

      {result ? (
        <pre className="mt-5 max-h-[520px] overflow-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-slate-100">
          <code className={`language-${props.language}`}>{result.code}</code>
        </pre>
      ) : null}
    </section>
  );
}

function ReviewShell({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#09111f_0%,_#101c30_100%)] px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-slate-300">
        {message}
      </div>
    </div>
  );
}
