import { apiUrl, buildAuthHeaders } from "./api";

export async function streamChatCompletion(params: {
  reviewId: string;
  body: {
    message: string;
    history: Array<{
      role: "user" | "assistant";
      content: string;
    }>;
  };
  onDelta: (delta: string) => void;
}): Promise<void> {
  const response = await fetch(apiUrl(`/api/reviews/${params.reviewId}/chat`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders()
    },
    body: JSON.stringify(params.body)
  });

  if (!response.ok || !response.body) {
    throw new Error(`Chat request failed with status ${response.status}.`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

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
      if (parsed?.event === "chat") {
        params.onDelta(String(parsed.data?.delta ?? ""));
      }
    }
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
