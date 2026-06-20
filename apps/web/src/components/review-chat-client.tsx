"use client";

import { useQuery } from "@tanstack/react-query";
import { FormEvent, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import { streamChatCompletion } from "../lib/chat-stream";
import type { ChatMessage, ReviewDetail } from "../lib/review";
import { trimToApproxTokens } from "../lib/review";
import { useReviewChatStore } from "../store/review-chat";

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
    <div className="min-h-screen bg-[linear-gradient(180deg,_#09111f_0%,_#101c30_100%)] px-6 py-10 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <p className="text-sm uppercase tracking-[0.32em] text-signal.mint">Code Context</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">
            {reviewQuery.data.submission.filename ?? "Review chat"}
          </h1>
          <p className="mt-2 text-sm leading-7 text-slate-300">
            The backend sends full review context and conversation history on each turn, with the source code trimmed at roughly 8,000 tokens for large files.
          </p>
          <pre className="mt-6 max-h-[60vh] overflow-auto rounded-3xl border border-white/10 bg-[#0b1220] p-5 text-xs leading-6 text-slate-200">
            {trimToApproxTokens(reviewQuery.data.submission.sourceCode, 8_000)}
          </pre>
        </section>

        <section className="flex min-h-[70vh] flex-col rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <div className="border-b border-white/10 pb-4">
            <p className="text-sm uppercase tracking-[0.32em] text-signal.mint">Chat With Your Code</p>
            <p className="mt-2 text-sm text-slate-300">
              Ask about a specific issue or the whole review. Responses stream in over SSE from the active AI provider.
            </p>
          </div>

          <div className="mt-5 flex-1 space-y-4 overflow-auto pr-1">
            {messages.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-4 text-sm text-slate-400">
                Try: &quot;Why is this a memory leak?&quot; or &quot;How would I refactor this to async/await?&quot;
              </div>
            ) : null}

            {messages.map((message) => (
              <article
                key={message.id}
                className={`rounded-3xl px-4 py-3 text-sm leading-7 ${
                  message.role === "user"
                    ? "ml-8 bg-paper text-ink"
                    : "mr-8 border border-white/10 bg-[#0b1220] text-slate-100"
                }`}
              >
                <p className="mb-2 text-xs uppercase tracking-[0.22em] opacity-70">
                  {message.role === "user" ? "You" : "AI Coach"}
                </p>
                <p>{message.content}</p>
              </article>
            ))}
          </div>

          <form className="mt-5 space-y-3" onSubmit={onSubmit}>
            <label className="sr-only" htmlFor="chat-message">
              Ask a follow-up question about this review
            </label>
            <textarea
              id="chat-message"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={4}
              className="w-full rounded-3xl border border-white/10 bg-[#0b1220] px-4 py-3 text-slate-100 outline-none transition focus:border-signal.mint"
              placeholder="Why is this a security issue?"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Full chat history is kept in Zustand for this review session.
              </p>
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="rounded-full bg-paper px-5 py-3 text-sm font-medium text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? "Streaming..." : "Send"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

function ChatShell({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#09111f_0%,_#101c30_100%)] px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-slate-300">
        {message}
      </div>
    </div>
  );
}
