import type { RequestHandler } from "express";
import { redis } from "../lib/redis.js";
import type { AuthenticatedRequest } from "../types/express.js";

const DAILY_LIMITS = {
  free: 10,
  pro: 100,
  team: Number.POSITIVE_INFINITY
} as const;

export const reviewRateLimitMiddleware: RequestHandler = async (request, response, next): Promise<void> => {
  const authRequest = request as AuthenticatedRequest;
  const limit = DAILY_LIMITS[authRequest.auth.tier];
  if (!Number.isFinite(limit)) {
    next();
    return;
  }

  const now = new Date();
  const resetAt = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  const ttlSeconds = Math.max(1, Math.floor((resetAt - now.getTime()) / 1000));
  const key = `rate-limit:reviews:${authRequest.auth.userId}:${now.toISOString().slice(0, 10)}`;

  await redis.connect().catch(() => undefined);
  const used = await redis.incr(key);
  if (used === 1) {
    await redis.expire(key, ttlSeconds);
  }

  response.setHeader("X-RateLimit-Limit", String(limit));
  response.setHeader("X-RateLimit-Remaining", String(Math.max(0, limit - used)));
  response.setHeader("X-RateLimit-Reset", String(Math.floor(resetAt / 1000)));

  if (used > limit) {
    response.status(429).json({
      error: "Daily review limit reached.",
      limit,
      resetAt: new Date(resetAt).toISOString()
    });
    return;
  }

  next();
};
