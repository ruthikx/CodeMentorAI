import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { authMiddleware } from "../middleware/auth";
import { errorHandler } from "../middleware/error-handler";
import { reviewsRouter } from "./reviews";

jest.mock("../lib/redis.js", () => ({
  redis: {
    connect: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn()
  }
}));

jest.mock("../lib/prisma.js", () => ({
  prisma: {
    codeSubmission: {
      create: jest.fn()
    },
    reviewResult: {
      create: jest.fn(),
      findFirst: jest.fn()
    },
    reviewIssue: {
      findFirst: jest.fn(),
      update: jest.fn()
    }
  }
}));

jest.mock("../lib/review-runner.js", () => ({
  runReviewGeneration: jest.fn(),
  toReviewIssueSummary: jest.fn()
}));

const mockRedis = jest.requireMock("../lib/redis.js").redis as {
  connect: jest.Mock;
  incr: jest.Mock;
  expire: jest.Mock;
};
const mockPrisma = jest.requireMock("../lib/prisma.js").prisma as {
  codeSubmission: { create: jest.Mock };
  reviewResult: { create: jest.Mock };
};
const mockRunReviewGeneration = jest.requireMock("../lib/review-runner.js").runReviewGeneration as jest.Mock;

function createReviewsTestApp() {
  const app = express();

  app.use(express.json({ limit: "1mb" }));
  app.use(authMiddleware);
  app.use("/api/reviews", reviewsRouter);
  app.use(errorHandler);

  return app;
}

function bearerToken(params: { sub?: string; tier?: "free" | "pro" | "team" } = {}) {
  return jwt.sign(
    {
      sub: params.sub ?? "user-1",
      email: "user@example.com",
      tier: params.tier ?? "free"
    },
    process.env.JWT_SECRET ?? "test-secret",
    {
      audience: process.env.JWT_AUDIENCE,
      issuer: process.env.JWT_ISSUER
    }
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRedis.connect.mockResolvedValue(undefined);
  mockRedis.incr.mockResolvedValue(1);
  mockRedis.expire.mockResolvedValue(1);
  mockPrisma.codeSubmission.create.mockResolvedValue({ id: "submission-1" });
  mockPrisma.reviewResult.create.mockResolvedValue({ id: "review-1" });
});

describe("POST /api/reviews", () => {
  it("rejects unauthenticated requests", async () => {
    const response = await request(createReviewsTestApp()).post("/api/reviews").send({
      code: "const ok = true;",
      language: "typescript"
    });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ error: "Missing Bearer token." });
  });

  it("enforces the daily review rate limit", async () => {
    mockRedis.incr.mockResolvedValue(11);

    const response = await request(createReviewsTestApp())
      .post("/api/reviews")
      .set("Authorization", `Bearer ${bearerToken({ tier: "free" })}`)
      .send({
        code: "const ok = true;",
        language: "typescript"
      });

    expect(response.status).toBe(429);
    expect(response.body).toMatchObject({
      error: "Daily review limit reached.",
      limit: 10
    });
  });

  it("rejects submissions over 100KB", async () => {
    const response = await request(createReviewsTestApp())
      .post("/api/reviews")
      .set("Authorization", `Bearer ${bearerToken({ tier: "pro" })}`)
      .send({
        code: "a".repeat(100 * 1024 + 1),
        language: "typescript"
      });

    expect(response.status).toBe(413);
    expect(response.body).toMatchObject({
      error: "Submission exceeds the 100KB maximum size.",
      maxBytes: 100 * 1024
    });
  });

  it("creates a review for valid authenticated requests", async () => {
    const response = await request(createReviewsTestApp())
      .post("/api/reviews")
      .set("Authorization", `Bearer ${bearerToken({ tier: "pro" })}`)
      .send({
        code: "const ok = true;",
        language: "typescript",
        filename: "example.ts"
      });

    expect(response.status).toBe(202);
    expect(response.body).toEqual({
      reviewId: "review-1",
      status: "processing"
    });
    expect(mockPrisma.codeSubmission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
          language: "typescript",
          filename: "example.ts"
        })
      })
    );
    expect(mockRunReviewGeneration).toHaveBeenCalledWith(expect.objectContaining({ reviewId: "review-1" }));
  });
});
