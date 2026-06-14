import { apiUrl, buildAuthHeaders } from "./api";
import type { ReviewIssue } from "./review";

export async function streamReviewIssues(params: {
  reviewId: string;
  onStatus: (status: string) => void;
  onIssue: (issue: ReviewIssue) => void;
  onComplete: () => void;
  onError: () => void;
  onUnexpectedClose?: () => void;
  signal?: AbortSignal;
}): Promise<void> {
  const response = await fetch(apiUrl(`/api/reviews/${params.reviewId}/stream`), {
    method: "GET",
    headers: buildAuthHeaders({
      Accept: "text/event-stream"
    }),
    signal: params.signal,
    cache: "no-store"
  });

  if (!response.ok || !response.body) {
    params.onError();
    throw new Error(`Review stream failed with status ${response.status}.`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let latestStatus = "processing";
  let completed = false;
  let errored = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    let boundary = buffer.indexOf("\n\n");

    while (boundary !== -1) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");

      const parsed = parseSSEEvent(rawEvent);
      if (!parsed) {
        continue;
      }

      if (parsed.event === "status") {
        latestStatus = String(parsed.data?.status ?? "processing");
        if (latestStatus === "complete") {
          completed = true;
        }
        params.onStatus(latestStatus);
      }

      if (parsed.event === "issue") {
        params.onIssue(parsed.data as unknown as ReviewIssue);
      }

      if (parsed.event === "complete") {
        completed = true;
        latestStatus = "complete";
        params.onComplete();
      }

      if (parsed.event === "error") {
        errored = true;
        params.onError();
      }
    }
  }

  if (!completed && latestStatus !== "complete" && !errored && !params.signal?.aborted) {
    params.onUnexpectedClose?.();
  }
}

function parseSSEEvent(rawEvent: string): { event: string | null; data: Record<string, unknown> | null } | null {
  const lines = rawEvent.split(/\r?\n/);
  const eventLine = lines.find((line) => line.startsWith("event:"));
  const dataLine = lines.find((line) => line.startsWith("data:"));

  if (!dataLine) {
    return null;
  }

  return {
    event: eventLine ? eventLine.slice(6).trim() : null,
    data: JSON.parse(dataLine.slice(5).trim()) as Record<string, unknown>
  };
}
