import type { NextFunction, Request, Response } from "express";

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
): void {
  console.error("API error", error);
  response.status(500).json({
    error: "Internal server error.",
    detail: error instanceof Error ? error.message : String(error)
  });
}
