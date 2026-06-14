import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma.js";
import { redis } from "./lib/redis.js";
import { authMiddleware } from "./middleware/auth.js";
import { errorHandler } from "./middleware/error-handler.js";
import { authRouter } from "./routes/auth.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { githubRouter } from "./routes/github.js";
import { reviewsRouter } from "./routes/reviews.js";
import { submissionsRouter } from "./routes/submissions.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use("/api/github/webhook", express.raw({ type: "*/*", limit: "1mb" }));
  app.use((request, _response, next) => {
    if (Buffer.isBuffer(request.body)) {
      (request as typeof request & { rawBody?: Buffer }).rawBody = request.body;
    }
    next();
  });
  app.use(express.json({ limit: "1mb" }));
  app.get("/api/health", async (_request, response) => {
    const [dbConnected, redisConnected] = await Promise.all([
      checkPostgresConnection(),
      checkRedisConnection()
    ]);

    response.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      dbConnected,
      redisConnected
    });
  });
  app.use(authMiddleware);

  app.use("/auth", authRouter);
  app.use("/api/reviews", reviewsRouter);
  app.use("/api/submissions", submissionsRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/github", githubRouter);

  app.use(errorHandler);
  return app;
}

async function checkPostgresConnection(): Promise<boolean> {
  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, 2000);
    return true;
  } catch {
    return false;
  }
}

async function checkRedisConnection(): Promise<boolean> {
  try {
    if (redis.status === "wait" || redis.status === "end") {
      await withTimeout(redis.connect(), 2000);
    }

    await withTimeout(redis.ping(), 2000);
    return true;
  } catch {
    return false;
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error("Health check timed out.")), timeoutMs);
      })
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}
