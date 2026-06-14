import type { Response } from "express";

export function setupSSE(response: Response): void {
  response.setHeader("Content-Type", "text/event-stream");
  response.setHeader("Cache-Control", "no-cache, no-transform");
  response.setHeader("Connection", "keep-alive");
  response.setHeader("X-Accel-Buffering", "no");
  response.flushHeaders?.();
}

export function sendSSE(response: Response, event: string, data: unknown): void {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function closeSSE(response: Response): void {
  if (!response.writableEnded) {
    response.end();
  }
}
