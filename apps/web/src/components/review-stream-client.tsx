"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../lib/api";
import type { ReviewDetail, ReviewIssue } from "../lib/review";
import { streamReviewIssues } from "../lib/review-stream";
import { IssueCard } from "./issue-card";

export function ReviewStreamClient({ reviewId }: { reviewId: string }) {
  const [streamedIssues, setStreamedIssues] = useState<ReviewIssue[]>([]);
  const [status, setStatus] = useState<ReviewDetail["status"]>("processing");
  const [streamError, setStreamError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
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
                onFocus={() => setActiveIndex(index)}
                onAccept={(accepted) => patchIssue.mutate({ issueId: issue.id, accepted })}
              />
            </div>
          ))}
        </div>

        {orderedIssues.length === 0 && status === "processing" ? (
          <ReviewShell message="Waiting for the first issue to arrive..." />
        ) : null}
      </div>
    </div>
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
