"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ApiError, apiFetch } from "../lib/api";

interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
}

export function GitHubEditorClient() {
  const router = useRouter();
  const [repoId, setRepoId] = useState("");
  const [prNumber, setPrNumber] = useState("");

  const reposQuery = useQuery({
    queryKey: ["github-repos"],
    queryFn: () => apiFetch<{ repos: GitHubRepo[] }>("/api/github/repos"),
    retry: (failureCount, error) => !(error instanceof ApiError && error.status === 401) && failureCount < 2
  });

  const repos = useMemo(() => reposQuery.data?.repos ?? [], [reposQuery.data?.repos]);

  useEffect(() => {
    if (!repoId && repos.length > 0) {
      setRepoId(String(repos[0].id));
    }
  }, [repoId, repos]);

  const startGitHubReview = useMutation({
    mutationFn: () =>
      apiFetch<{ reviewId: string }>(`/api/github/repos/${repoId}/review`, {
        method: "POST",
        body: JSON.stringify({
          prNumber: Number.parseInt(prNumber, 10)
        })
      }),
    onSuccess: (payload) => router.push(`/review/${payload.reviewId}`)
  });

  const parsedPrNumber = Number.parseInt(prNumber, 10);
  const canStartGitHubReview = Boolean(repoId) && Number.isInteger(parsedPrNumber) && parsedPrNumber > 0;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#09111f_0%,_#101c30_100%)] px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="max-w-3xl space-y-3">
          <p className="text-sm uppercase tracking-[0.32em] text-signal.mint">GitHub + Web Editor</p>
          <h1 className="text-4xl font-semibold text-white">Review code from a pull request or the browser editor.</h1>
          <p className="text-sm leading-7 text-slate-300">
            Select an updated GitHub repository and PR number, or jump into the Monaco editor for pasted code.
          </p>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-card">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-medium text-white">GitHub PR Review</h2>
                <p className="mt-1 text-sm text-slate-300">Queue a review from a connected GitHub repository.</p>
              </div>
              {reposQuery.isFetching ? (
                <span className="text-sm text-slate-400">Loading repos...</span>
              ) : null}
            </div>

            <div className="grid gap-4">
              <label className="space-y-2 text-sm text-slate-300">
                <span>Repository</span>
                <select
                  value={repoId}
                  onChange={(event) => setRepoId(event.target.value)}
                  disabled={reposQuery.isLoading || repos.length === 0}
                  className="w-full rounded-2xl border border-white/10 bg-[#0d1524] px-4 py-3 text-white outline-none transition focus:border-signal.mint disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {repos.length === 0 ? (
                    <option value="">No repositories found</option>
                  ) : (
                    repos.map((repo) => (
                      <option key={repo.id} value={repo.id}>
                        {repo.fullName}{repo.private ? " (private)" : ""}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label className="space-y-2 text-sm text-slate-300">
                <span>Pull request number</span>
                <input
                  value={prNumber}
                  onChange={(event) => setPrNumber(event.target.value)}
                  inputMode="numeric"
                  className="w-full rounded-2xl border border-white/10 bg-[#0d1524] px-4 py-3 text-white outline-none transition focus:border-signal.mint"
                  placeholder="42"
                />
              </label>

              <button
                type="button"
                onClick={() => startGitHubReview.mutate()}
                disabled={!canStartGitHubReview || startGitHubReview.isPending}
                className="w-full rounded-full bg-paper px-6 py-3 font-medium text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:self-start"
              >
                {startGitHubReview.isPending ? "Starting GitHub Review..." : "Start GitHub Review"}
              </button>
            </div>

            {reposQuery.error ? (
              <p className="mt-5 rounded-2xl border border-signal.red/30 bg-signal.red/10 px-4 py-3 text-sm text-signal.red">
                {reposQuery.error.message}
              </p>
            ) : null}

            {startGitHubReview.error ? (
              <p className="mt-5 rounded-2xl border border-signal.red/30 bg-signal.red/10 px-4 py-3 text-sm text-signal.red">
                {startGitHubReview.error.message}
              </p>
            ) : null}
          </section>

          <section className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-card">
            <div>
              <h2 className="text-xl font-medium text-white">Web Editor</h2>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                Paste a snippet into the Monaco editor, adjust the detected language, and stream the review immediately.
              </p>
            </div>
            <Link
              className="mt-8 inline-flex rounded-full bg-signal.blue px-6 py-3 font-medium text-white transition hover:bg-blue-500"
              href="/review/new"
            >
              Open Web Editor
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
