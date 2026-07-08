"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronLeft, ChevronRight, FileCode2, History, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { apiFetch } from "../lib/api";
import type { SubmissionListResponse } from "../lib/review";

const PAGE_SIZE = 10;

export function HistoryClient() {
  const [page, setPage] = useState(1);
  const [language, setLanguage] = useState("");

  const historyQuery = useQuery({
    queryKey: ["submissions", page, language],
    queryFn: () =>
      apiFetch<SubmissionListResponse>(
        `/api/submissions?page=${page}&limit=${PAGE_SIZE}${language ? `&lang=${encodeURIComponent(language)}` : ""}`
      )
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] px-6 py-6 text-white selection:bg-blue-500/30 lg:px-10">
      <div className="pointer-events-none absolute left-1/4 top-20 h-[480px] w-[480px] rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-24 right-0 h-[360px] w-[360px] rounded-full bg-blue-500/10 blur-[140px]" />

      <div className="relative z-10 mx-auto max-w-[1400px] space-y-10">
        <header className="grid gap-8 border-b border-white/5 pb-10 lg:grid-cols-[1fr_420px] lg:items-end">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-gradient-to-r from-white/[0.08] to-white/[0.02] px-3 py-1.5 text-sm font-medium text-neutral-300 shadow-[0_0_15px_rgba(255,255,255,0.03)] backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              Review History
            </div>
            <div className="space-y-4">
              <h1 className="bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-[2.75rem] font-bold leading-[1.08] tracking-normal text-transparent sm:text-6xl">
                Filter and revisit past submissions.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-neutral-400 sm:text-lg sm:leading-relaxed">
                Jump back into previous code reviews, inspect the latest review for each submission, and continue learning from the fixes you accepted.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-md">
            <label className="space-y-3 text-sm text-neutral-300">
              <span className="flex items-center gap-2 font-medium text-white">
                <Search className="h-4 w-4 text-blue-300" />
                Language filter
              </span>
              <input
                value={language}
                onChange={(event) => {
                  setLanguage(event.target.value);
                  setPage(1);
                }}
                className="h-12 w-full rounded-full border border-white/10 bg-white/[0.04] px-5 text-white outline-none transition placeholder:text-neutral-600 focus:border-blue-400/60 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(59,130,246,0.12)]"
                placeholder="typescript"
              />
            </label>
            <div className="mt-5 flex items-center gap-3 text-xs text-neutral-500">
              <Sparkles className="h-4 w-4 text-purple-300/80" />
              <span>{historyQuery.data?.total ?? 0} saved submissions</span>
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-md">
          <div className="hidden grid-cols-[1.35fr_0.65fr_0.75fr] gap-4 border-b border-white/10 px-6 py-4 text-xs uppercase tracking-[0.22em] text-neutral-500 md:grid">
            <span>Submission</span>
            <span>Language</span>
            <span>Submitted</span>
          </div>
          <div className="divide-y divide-white/10">
            {historyQuery.isLoading ? (
              <div className="space-y-4 px-6 py-8">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="grid gap-4 md:grid-cols-[1.35fr_0.65fr_0.75fr]">
                    <div className="space-y-3">
                      <div className="h-4 w-56 max-w-full rounded-full bg-white/10" />
                      <div className="h-3 w-40 max-w-full rounded-full bg-white/[0.06]" />
                    </div>
                    <div className="h-7 w-28 rounded-full bg-white/[0.06]" />
                    <div className="h-4 w-24 rounded-full bg-white/[0.06]" />
                  </div>
                ))}
              </div>
            ) : null}

            {historyQuery.isError ? (
              <div className="flex flex-col gap-3 px-6 py-10 text-sm text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
                <span>History could not be loaded right now.</span>
                <button
                  className="inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-4 font-medium text-white transition hover:border-white/20 hover:bg-white/[0.08]"
                  type="button"
                  onClick={() => historyQuery.refetch()}
                >
                  Try again
                </button>
              </div>
            ) : null}

            {historyQuery.data?.submissions.map((submission) => (
              <a
                key={submission.id}
                href={submission.latestReviewId ? `/review/${submission.latestReviewId}` : "#"}
                className="group grid gap-5 px-6 py-5 transition hover:bg-white/[0.04] md:grid-cols-[1.35fr_0.65fr_0.75fr] md:items-center"
              >
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] transition group-hover:border-blue-400/30 group-hover:bg-blue-500/10">
                    <FileCode2 className="h-5 w-5 text-neutral-300 transition group-hover:text-blue-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{submission.filename ?? "Untitled submission"}</p>
                    <p className="mt-1 truncate text-sm text-neutral-500">Submission ID: {submission.id}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 md:block">
                  <span className="text-xs uppercase tracking-[0.18em] text-neutral-600 md:hidden">Language</span>
                  <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-neutral-200">
                    {submission.language}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm text-neutral-400 md:block">
                  <span className="text-xs uppercase tracking-[0.18em] text-neutral-600 md:hidden">Submitted</span>
                  <span className="inline-flex items-center gap-2">
                    {new Date(submission.submittedAt).toLocaleDateString()}
                    <ArrowRight className="hidden h-4 w-4 text-neutral-600 transition group-hover:translate-x-1 group-hover:text-blue-300 md:inline" />
                  </span>
                </div>
              </a>
            ))}

            {historyQuery.data && historyQuery.data.submissions.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                  <History className="h-6 w-6 text-neutral-300" />
                </div>
                <h2 className="text-xl font-semibold text-white">No matching submissions</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-neutral-400">
                  No submissions match this filter yet. Try another language or start a new review.
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <div className="flex items-center justify-between gap-4">
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm font-medium text-neutral-200 transition hover:border-white/20 hover:bg-white/[0.08] disabled:pointer-events-none disabled:opacity-40"
            disabled={page === 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <p className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-neutral-400">
            Page {historyQuery.data?.page ?? page}
          </p>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm font-medium text-neutral-200 transition hover:border-white/20 hover:bg-white/[0.08] disabled:pointer-events-none disabled:opacity-40"
            disabled={!historyQuery.data || historyQuery.data.submissions.length < PAGE_SIZE}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
