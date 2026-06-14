"use client";

import { useQuery } from "@tanstack/react-query";
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
    <div className="min-h-screen bg-[linear-gradient(180deg,_#09111f_0%,_#101c30_100%)] px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.32em] text-signal.mint">History</p>
            <h1 className="text-4xl font-semibold text-white">Filter and revisit past submissions.</h1>
          </div>
          <label className="space-y-2 text-sm text-slate-300">
            <span>Language filter</span>
            <input
              value={language}
              onChange={(event) => {
                setLanguage(event.target.value);
                setPage(1);
              }}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-signal.mint"
              placeholder="typescript"
            />
          </label>
        </header>

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-card">
          <div className="grid grid-cols-[1.25fr_0.7fr_0.85fr] gap-4 border-b border-white/10 px-6 py-4 text-xs uppercase tracking-[0.22em] text-slate-400">
            <span>Submission</span>
            <span>Language</span>
            <span>Submitted</span>
          </div>
          <div className="divide-y divide-white/10">
            {historyQuery.data?.submissions.map((submission) => (
              <a
                key={submission.id}
                href={submission.latestReviewId ? `/review/${submission.latestReviewId}` : "#"}
                className="grid grid-cols-[1.25fr_0.7fr_0.85fr] gap-4 px-6 py-5 transition hover:bg-white/[0.05]"
              >
                <div>
                  <p className="font-medium text-white">{submission.filename ?? "Untitled submission"}</p>
                  <p className="mt-1 text-sm text-slate-400">Submission ID: {submission.id}</p>
                </div>
                <p className="text-sm text-slate-200">{submission.language}</p>
                <p className="text-sm text-slate-300">
                  {new Date(submission.submittedAt).toLocaleDateString()}
                </p>
              </a>
            ))}

            {historyQuery.data && historyQuery.data.submissions.length === 0 ? (
              <div className="px-6 py-8 text-sm text-slate-400">No submissions match this filter yet.</div>
            ) : null}
          </div>
        </section>

        <div className="flex items-center justify-between">
          <button
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 disabled:opacity-40"
            disabled={page === 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </button>
          <p className="text-sm text-slate-400">Page {historyQuery.data?.page ?? page}</p>
          <button
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 disabled:opacity-40"
            disabled={!historyQuery.data || historyQuery.data.submissions.length < PAGE_SIZE}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
