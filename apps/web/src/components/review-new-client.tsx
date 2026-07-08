"use client";

import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Code, RefreshCw, Sparkles, Terminal, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { detectLanguage } from "../lib/review";
import { Editor } from "./monaco-shell";
import { Spotlight } from "./ui/spotlight";

const LANGUAGE_OPTIONS = ["plaintext", "javascript", "typescript", "python", "java", "go", "rust", "cpp", "html", "css", "sql"];

export function ReviewNewClient() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("plaintext");
  const [filename, setFilename] = useState("");

  useEffect(() => {
    if (!code.trim()) {
      setLanguage("plaintext");
      return;
    }

    setLanguage(detectLanguage(code));
  }, [code]);

  const createReview = useMutation({
    mutationFn: () =>
      apiFetch<{ reviewId: string }>("/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          code,
          language,
          filename: filename || undefined
        })
      }),
    onSuccess: (payload) => router.push(`/review/${payload.reviewId}`)
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] px-6 py-12 font-sans text-white selection:bg-blue-500/30 lg:px-10">
      <div className="pointer-events-none absolute left-1/4 top-24 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f14_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f14_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_70%_45%_at_50%_0%,#000_55%,transparent_100%)]" />

      <main className="relative z-10 mx-auto flex max-w-[1400px] flex-col gap-8">
        <header className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-end">
          <div className="flex min-w-0 flex-col items-start gap-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-gradient-to-r from-white/[0.08] to-white/[0.02] px-3 py-1.5 text-sm font-medium text-neutral-300 shadow-[0_0_15px_rgba(255,255,255,0.03)] backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              Code Review Workspace
            </div>
            <div className="space-y-4">
              <h1 className="max-w-4xl bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-[2.5rem] font-bold leading-[1.08] tracking-normal text-transparent sm:text-5xl lg:text-6xl">
                Review your code.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-neutral-400 sm:text-lg sm:leading-relaxed">
                Paste code into the editor, confirm the detected language, and start the same live teaching review workflow from the Home page.
              </p>
            </div>
          </div>

          <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 shadow-2xl backdrop-blur-md sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <label className="space-y-2 text-sm text-neutral-300">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                <Upload className="h-3.5 w-3.5 text-blue-400" />
                Filename
              </span>
              <input
                value={filename}
                onChange={(event) => setFilename(event.target.value)}
                className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-neutral-600 focus:border-blue-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-blue-500/20"
                placeholder="example.ts"
              />
            </label>
            <label className="space-y-2 text-sm text-neutral-300">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                <Code className="h-3.5 w-3.5 text-purple-400" />
                Language
              </span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition focus:border-blue-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-blue-500/20"
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option className="bg-[#09090a] text-white" key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
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
                  {filename || "untitled"} - CodeMentor Editor
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">{language}</span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                  {code.trim().length} chars
                </span>
              </div>
            </div>

            <div className="bg-[#09090a]">
              <Editor
                height="68vh"
                language={language}
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value ?? "")}
                options={{
                  minimap: { enabled: false },
                  wordWrap: "on",
                  fontSize: 14,
                  automaticLayout: true
                }}
              />
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
              <Terminal className="h-5 w-5 text-blue-400" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles className="h-4 w-4 text-blue-400" />
                Ready for live review
              </div>
              <p className="max-w-2xl text-sm leading-6 text-neutral-400">
                Submit from the web editor now, then review the streamed issue cards and suggested diffs on the next page.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => createReview.mutate()}
            disabled={createReview.isPending || code.trim().length === 0}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-[0_0_20px_rgba(255,255,255,0.12)] transition-all duration-300 hover:scale-[1.02] hover:bg-neutral-100 hover:shadow-[0_0_30px_rgba(255,255,255,0.22)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 md:w-auto"
          >
            {createReview.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-black" />
                Starting Review...
              </>
            ) : (
              <>
                Submit Review
                <ArrowRight className="h-4 w-4 text-black" />
              </>
            )}
          </button>
        </div>

        {createReview.error ? (
          <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {createReview.error.message}
          </p>
        ) : null}
      </main>
    </div>
  );
}
