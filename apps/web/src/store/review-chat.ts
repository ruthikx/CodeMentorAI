"use client";

import { create } from "zustand";
import type { ChatMessage } from "../lib/review";

interface ReviewChatState {
  messagesByReviewId: Record<string, ChatMessage[]>;
  appendMessage: (reviewId: string, message: ChatMessage) => void;
  appendAssistantDelta: (reviewId: string, delta: string) => void;
}

export const useReviewChatStore = create<ReviewChatState>((set) => ({
  messagesByReviewId: {},
  appendMessage: (reviewId, message) =>
    set((state) => ({
      messagesByReviewId: {
        ...state.messagesByReviewId,
        [reviewId]: [...(state.messagesByReviewId[reviewId] ?? []), message]
      }
    })),
  appendAssistantDelta: (reviewId, delta) =>
    set((state) => {
      const messages = [...(state.messagesByReviewId[reviewId] ?? [])];
      const last = messages[messages.length - 1];

      if (!last || last.role !== "assistant") {
        messages.push({
          id: crypto.randomUUID(),
          role: "assistant",
          content: delta,
          createdAt: new Date().toISOString()
        });
      } else {
        last.content += delta;
      }

      return {
        messagesByReviewId: {
          ...state.messagesByReviewId,
          [reviewId]: messages
        }
      };
    })
}));
