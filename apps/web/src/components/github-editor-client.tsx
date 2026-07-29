"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Code2,
  FolderGit2,
  GitPullRequest,
  Github,
  Loader2,
  LockKeyhole,
  Sparkles
} from "lucide-react";
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
    <div className="relative min-h-screen overflow-hidden bg-[#050505] px-6 py-10 font-sans text-white lg:px-10 lg:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f14_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f14_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:linear-gradient(to_bottom,#000_0%,transparent_72%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.14),transparent_68%)]" />

      <main className="relative z-10 mx-auto flex max-w-[1400px] flex-col gap-10">
        <header className="grid gap-8 border-b border-white/5 pb-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end">
          <div className="max-w-4xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-neutral-300 backdrop-blur-md">
              <Github className="h-4 w-4 text-blue-400" />
              GitHub Workspace
            </div>
            <div className="space-y-4">
              <h1 className="bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-[2.75rem] font-bold leading-[1.08] tracking-normal text-transparent sm:text-6xl">
                Start a review from the right source.
              </h1>
              <p className="max-w-3xl text-base leading-7 text-neutral-400 sm:text-lg sm:leading-relaxed">
                Review a pull request from a connected repository or move into the browser editor for pasted code. Both paths use the same live review workflow.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10">
            <div className="bg-[#0b0b0c] p-5">
              <GitPullRequest className="h-5 w-5 text-blue-400" />
              <p className="mt-5 text-2xl font-semibold text-white">PR</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-neutral-500">Connected repo</p>
            </div>
            <div className="bg-[#0b0b0c] p-5">
              <Code2 className="h-5 w-5 text-emerald-400" />
              <p className="mt-5 text-2xl font-semibold text-white">Editor</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-neutral-500">Pasted code</p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#080809] shadow-2xl">
            <div className="flex flex-col gap-4 border-b border-white/10 bg-[#0d0d0f] px-5 py-5 sm:flex-row sm:items-start sm:justify-between lg:px-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                  <GitPullRequest className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">GitHub Pull Request</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Queue a connected PR</h2>
                  <p className="mt-2 text-sm leading-6 text-neutral-400">
                    Choose a repository and enter the pull request number to begin.
                  </p>
                </div>
              </div>
              {reposQuery.isFetching ? (
                <span className="inline-flex items-center gap-2 text-xs font-medium text-neutral-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Syncing repos
                </span>
              ) : null}
            </div>

            <div className="space-y-5 p-5 lg:p-6">
              <div className="grid gap-5">
                <label className="space-y-2 text-sm text-neutral-300">
                  <span className="flex items-center gap-2 font-medium text-white">
                    <FolderGit2 className="h-4 w-4 text-neutral-500" />
                    Repository
                  </span>
                  <select
                    value={repoId}
                    onChange={(event) => setRepoId(event.target.value)}
                    disabled={reposQuery.isLoading || repos.length === 0}
                    className="h-12 w-full rounded-xl border border-white/10 bg-black px-4 text-white outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
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

                <label className="space-y-2 text-sm text-neutral-300">
                  <span className="flex items-center gap-2 font-medium text-white">
                    <GitPullRequest className="h-4 w-4 text-neutral-500" />
                    Pull request number
                  </span>
                  <input
                    value={prNumber}
                    onChange={(event) => setPrNumber(event.target.value)}
                    inputMode="numeric"
                    className="h-12 w-full rounded-xl border border-white/10 bg-black px-4 text-white outline-none transition placeholder:text-neutral-700 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="42"
                  />
                </label>
              </div>

              <div className="flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <LockKeyhole className="h-4 w-4 text-neutral-600" />
                  Private repositories appear when GitHub access is enabled.
                </div>
                <button
                  type="button"
                  onClick={() => startGitHubReview.mutate()}
                  disabled={!canStartGitHubReview || startGitHubReview.isPending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-[0_0_20px_rgba(255,255,255,0.12)] transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {startGitHubReview.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Starting Review...
                    </>
                  ) : (
                    <>
                      Start GitHub Review
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

              {reposQuery.error ? (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {reposQuery.error.message}
                </p>
              ) : null}

              {startGitHubReview.error ? (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {startGitHubReview.error.message}
                </p>
              ) : null}
            </div>
          </section>

          <section className="flex min-h-[420px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#080809] shadow-2xl">
            <div className="border-b border-white/10 bg-[#0d0d0f] px-5 py-5 lg:px-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                  <Code2 className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Web Editor</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Review pasted code</h2>
                </div>
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-between gap-8 p-5 lg:p-6">
              <div>
                <p className="text-sm leading-7 text-neutral-400">
                  Paste a snippet into Monaco, confirm the detected language, and stream issue cards without choosing a repository.
                </p>
                <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black">
                  <div className="flex items-center gap-2 border-b border-white/10 bg-[#0d0d0f] px-4 py-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
                    <span className="ml-2 font-mono text-[10px] text-neutral-600">untitled.ts</span>
                  </div>
                  <div className="space-y-3 p-4 font-mono text-xs">
                    <p className="text-neutral-500"><span className="mr-4 text-neutral-700">1</span><span className="text-blue-300">function</span> review(code) {"{"}</p>
                    <p className="pl-8 text-neutral-400"><span className="text-emerald-300">return</span> mentor.analyze(code);</p>
                    <p className="text-neutral-500"><span className="mr-4 text-neutral-700">3</span>{"}"}</p>
                  </div>
                </div>
              </div>

              <Link
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.08] sm:w-auto sm:self-start"
                href="/review/new"
              >
                <Sparkles className="h-4 w-4 text-blue-400" />
                Open Web Editor
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
