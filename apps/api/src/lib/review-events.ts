import { EventEmitter } from "node:events";

export type ReviewStreamEvent =
  | { type: "issue"; payload: Record<string, unknown> }
  | { type: "complete"; payload: Record<string, unknown> }
  | { type: "error"; payload: Record<string, unknown> }
  | { type: "chat"; payload: Record<string, unknown> };

const emitter = new EventEmitter();

export function emitReviewEvent(reviewId: string, event: ReviewStreamEvent): void {
  emitter.emit(reviewId, event);
}

export function subscribeToReviewEvents(
  reviewId: string,
  listener: (event: ReviewStreamEvent) => void
): () => void {
  emitter.on(reviewId, listener);
  return () => emitter.off(reviewId, listener);
}
