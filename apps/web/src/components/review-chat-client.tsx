"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Bot, Code2, MessageSquare, Send, Sparkles, Terminal } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import { streamChatCompletion } from "../lib/chat-stream";
import type { ChatMessage, ReviewDetail } from "../lib/review";
import { trimToApproxTokens } from "../lib/review";
import { useReviewChatStore } from "../store/review-chat";
import { Spotlight } from "./ui/spotlight";

const EMPTY_MESSAGES: ChatMessage[] = [];

export function ReviewChatClient({ reviewId }: { reviewId: string }) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const reviewQuery = useQuery({
    queryKey: ["review", reviewId, "chat"],
    queryFn: () => apiFetch<ReviewDetail>(`/api/reviews/${reviewId}`)
  });

  const messages = useReviewChatStore((state) => state.messagesByReviewId[reviewId] ?? EMPTY_MESSAGES);
  const appendMessage = useReviewChatStore((state) => state.appendMessage);
  const appendAssistantDelta = useReviewChatStore((state) => state.appendAssistantDelta);
  const history = useMemo(
    () => messages.map((message) => ({ role: message.role, content: message.content })),
    [messages]
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!input.trim()) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      createdAt: new Date().toISOString()
    };

    appendMessage(reviewId, userMessage);
    const currentInput = input.trim();
    setInput("");
    setSending(true);

    try {
      await streamChatCompletion({
        reviewId,
        body: {
          message: currentInput,
          history
        },
        onDelta: (delta) => appendAssistantDelta(reviewId, delta)
      });
    } finally {
      setSending(false);
    }
  }

  if (reviewQuery.isLoading) {
    return <ChatShell message="Loading chat context..." />;
  }

  if (reviewQuery.error || !reviewQuery.data) {
    return <ChatShell message={reviewQuery.error?.message ?? "Review not found."} />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] px-6 py-12 font-sans text-white selection:bg-blue-500/30 lg:px-10">
      <div className="pointer-events-none absolute left-1/4 top-24 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f14_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f14_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_70%_45%_at_50%_0%,#000_55%,transparent_100%)]" />

      <main className="relative z-10 mx-auto flex max-w-[1400px] flex-col gap-8">
        <header className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="flex min-w-0 flex-col items-start gap-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-gradient-to-r from-white/[0.08] to-white/[0.02] px-3 py-1.5 text-sm font-medium text-neutral-300 shadow-[0_0_15px_rgba(255,255,255,0.03)] backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              Review Chat
            </div>
            <div className="space-y-4">
              <h1 className="max-w-4xl bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-[2.5rem] font-bold leading-[1.08] tracking-normal text-transparent sm:text-5xl lg:text-6xl">
                Discuss the review.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-neutral-400 sm:text-lg">
                {reviewQuery.data.submission.filename ?? "Untitled submission"} - {reviewQuery.data.submission.language}
              </p>
            </div>
          </div>

          <a
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08] sm:w-auto"
            href={`/review/${reviewId}`}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Review
          </a>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#070707] shadow-2xl">
            <Spotlight className="-top-40 left-0 md:-top-20 md:left-48" fill="white" />
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
                    {reviewQuery.data.submission.filename ?? "source"} - Context
                  </span>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                  <Code2 className="h-3.5 w-3.5 text-blue-400" />
                  {reviewQuery.data.submission.language}
                </span>
              </div>

              <pre className="max-h-[70vh] overflow-auto bg-[#09090a] p-5 text-xs leading-6 text-neutral-300 lg:min-h-[70vh]">
                {trimToApproxTokens(reviewQuery.data.submission.sourceCode, 8_000)}
              </pre>
            </div>
          </section>

          <section className="flex min-h-[70vh] flex-col overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#070707] shadow-2xl">
            <div className="border-b border-white/10 bg-[#0d0d0f] px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                    <MessageSquare className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">Chat Stream</p>
                    <h2 className="mt-1 text-lg font-semibold text-white">AI Coach</h2>
                  </div>
                </div>
                <span className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500 sm:inline-flex">
                  {messages.length} messages
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-auto p-5">
              {messages.length === 0 ? (
                <div className="flex items-center gap-3 rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-neutral-400">
                  <Bot className="h-5 w-5 flex-shrink-0 text-blue-400" />
                  <span>No chat messages yet.</span>
                </div>
              ) : null}

              {messages.map((message) => (
                <article
                  key={message.id}
                  className={`rounded-3xl px-4 py-3 text-sm leading-7 shadow-2xl ${
                    message.role === "user"
                      ? "ml-8 bg-white text-black"
                      : "mr-8 border border-white/10 bg-white/[0.04] text-neutral-100"
                  }`}
                >
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] opacity-70">
                    {message.role === "user" ? "You" : "AI Coach"}
                  </p>
                  <p>{message.content}</p>
                </article>
              ))}
            </div>

            <form className="border-t border-white/10 bg-[#0d0d0f] p-5" onSubmit={onSubmit}>
              <label className="sr-only" htmlFor="chat-message">
                Ask a follow-up question about this review
              </label>
              <textarea
                id="chat-message"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={4}
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-blue-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-blue-500/20"
                placeholder="Ask about a finding, tradeoff, or alternate fix"
              />
              <div className="mt-3 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black shadow-[0_0_20px_rgba(255,255,255,0.12)] transition-all duration-300 hover:scale-[1.02] hover:bg-neutral-100 hover:shadow-[0_0_30px_rgba(255,255,255,0.22)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 sm:w-auto"
                >
                  {sending ? (
                    <>
                      <Sparkles className="h-4 w-4 text-black" />
                      Streaming...
                    </>
                  ) : (
                    <>
                      Send
                      <Send className="h-4 w-4 text-black" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

function ChatShell({ message }: { message: string }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] px-6 py-12 font-sans text-white selection:bg-blue-500/30 lg:px-10">
      <div className="pointer-events-none absolute left-1/4 top-24 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/10 blur-[120px]" />
      <main className="relative z-10 mx-auto max-w-[1400px]">
        <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-neutral-300 shadow-2xl backdrop-blur-md">
          <Terminal className="h-5 w-5 flex-shrink-0 text-blue-400" />
          <span>{message}</span>
        </div>
      </main>
    </div>
  );
}
