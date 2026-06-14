"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { detectLanguage } from "../lib/review";
import { Editor } from "./monaco-shell";

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
    <div className="min-h-screen bg-[linear-gradient(180deg,_#09111f_0%,_#101c30_100%)] px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.32em] text-signal.mint">New Review</p>
            <h1 className="text-4xl font-semibold text-white">Review code in a Monaco editor before the AI stream starts.</h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-300">
              Language auto-detection looks at the first 200 characters of your code. You can override the guess before submission.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-300">
              <span>Filename</span>
              <input
                value={filename}
                onChange={(event) => setFilename(event.target.value)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-signal.mint"
                placeholder="example.ts"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>Language</span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-signal.mint"
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>

        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d1524] shadow-card">
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

        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 md:flex-row md:items-center md:justify-between">
          <p className="max-w-2xl text-sm leading-7 text-slate-300">
            Submit from the web editor now, then review the streamed issue cards and suggested diffs on the next page.
          </p>
          <button
            onClick={() => createReview.mutate()}
            disabled={createReview.isPending || code.trim().length === 0}
            className="rounded-full bg-paper px-6 py-3 font-medium text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createReview.isPending ? "Starting Review..." : "Submit Review"}
          </button>
        </div>

        {createReview.error ? (
          <p className="rounded-2xl border border-signal.red/30 bg-signal.red/10 px-4 py-3 text-sm text-signal.red">
            {createReview.error.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
