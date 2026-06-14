import type { RequestHandler } from "express";

const MAX_SUBMISSION_BYTES = 100 * 1024;

export const reviewSubmissionSizeMiddleware: RequestHandler = (request, response, next): void => {
  const body = request.body as { code?: unknown } | undefined;
  const code = typeof body?.code === "string" ? body.code : "";
  const bytes = Buffer.byteLength(code, "utf8");

  if (bytes > MAX_SUBMISSION_BYTES) {
    response.status(413).json({
      error: "Submission exceeds the 100KB maximum size.",
      maxBytes: MAX_SUBMISSION_BYTES
    });
    return;
  }

  next();
};
