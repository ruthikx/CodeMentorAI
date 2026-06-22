import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { authMiddleware } from "../middleware/auth";
import { errorHandler } from "../middleware/error-handler";
import { RepoReviewError } from "../lib/repo-review";
import { githubRouter } from "./github";

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
      create: jest.fn()
    }
  }
}));

jest.mock("../lib/github-queue.js", () => ({
  githubReviewQueue: {
    add: jest.fn()
  }
}));

jest.mock("../lib/github.js", () => ({
  fetchGitHubRepos: jest.fn(),
  verifyGitHubSignature: jest.fn()
}));

jest.mock("../lib/repo-review.js", () => {
  const actual = jest.requireActual("../lib/repo-review");
  return {
    ...actual,
    preparePublicRepoReview: jest.fn()
  };
});

jest.mock("@codementor-ai/ai/fallback", () => {
  class AIServiceUnavailableError extends Error {
    statusCode = 503;
  }

  return {
    AIServiceUnavailableError,
    streamRepoReviewWithFailover: jest.fn()
  };
});

const mockRedis = jest.requireMock("../lib/redis.js").redis as {
  connect: jest.Mock;
  incr: jest.Mock;
  expire: jest.Mock;
};
const mockPreparePublicRepoReview = jest.requireMock("../lib/repo-review.js").preparePublicRepoReview as jest.Mock;
const mockStreamRepoReviewWithFailover = jest.requireMock("@codementor-ai/ai/fallback").streamRepoReviewWithFailover as jest.Mock;

function createGithubTestApp() {
  const app = express();

  app.use(express.json({ limit: "1mb" }));
  app.use(authMiddleware);
  app.use("/api/github", githubRouter);
  app.use(errorHandler);

  return app;
}

function bearerToken(params: { sub?: string; tier?: "free" | "pro" | "team" } = {}) {
  return jwt.sign(
    {
      sub: params.sub ?? "user-1",
      email: "user@example.com",
      tier: params.tier ?? "pro"
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
  mockPreparePublicRepoReview.mockResolvedValue({
    repoUrl: "https://github.com/example/project",
    repoName: "example/project",
    defaultBranch: "main",
    fileTree: "* src/index.ts",
    languages: ["TypeScript"],
    filesScanned: 1,
    sourceContext: "### src/index.ts\n   1 | const ok = true;",
    sourceFiles: [
      {
        path: "src/index.ts",
        size: 16,
        content: "const ok = true;",
        score: 10
      }
    ]
  });
  mockStreamRepoReviewWithFailover.mockResolvedValue({
    providerUsed: "groq",
    modelUsed: "model",
    rawText: "{}",
    promptTokens: 1,
    completionTokens: 1,
    report: {
      summary: "Small TypeScript app.",
      repo: {
        url: "https://github.com/example/project",
        name: "example/project",
        defaultBranch: "main"
      },
      stats: {
        filesScanned: 1,
        languages: ["TypeScript"]
      },
      findings: [],
      nextSteps: ["Add tests."]
    }
  });
});

describe("POST /api/github/repo-review", () => {
  it("rejects unauthenticated requests", async () => {
    const response = await request(createGithubTestApp()).post("/api/github/repo-review").send({
      url: "https://github.com/example/project"
    });

    expect(response.status).toBe(401);
  });

  it("rejects missing URLs", async () => {
    const response = await request(createGithubTestApp())
      .post("/api/github/repo-review")
      .set("Authorization", `Bearer ${bearerToken()}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "GitHub repository URL is required." });
  });

  it("enforces review rate limits", async () => {
    mockRedis.incr.mockResolvedValue(101);

    const response = await request(createGithubTestApp())
      .post("/api/github/repo-review")
      .set("Authorization", `Bearer ${bearerToken({ tier: "pro" })}`)
      .send({ url: "https://github.com/example/project" });

    expect(response.status).toBe(429);
    expect(mockPreparePublicRepoReview).not.toHaveBeenCalled();
  });

  it("returns structured repo review reports", async () => {
    const response = await request(createGithubTestApp())
      .post("/api/github/repo-review")
      .set("Authorization", `Bearer ${bearerToken()}`)
      .send({
        url: "https://github.com/example/project",
        focus: "security"
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      summary: "Small TypeScript app.",
      stats: {
        filesScanned: 1,
        languages: ["TypeScript"]
      }
    });
    expect(mockStreamRepoReviewWithFailover).toHaveBeenCalledWith(
      expect.objectContaining({
        repoName: "example/project",
        focus: "security"
      }),
      expect.objectContaining({
        timeoutMs: expect.any(Number)
      })
    );
  });

  it("returns repo preparation errors without using the global 500 handler", async () => {
    mockPreparePublicRepoReview.mockRejectedValue(new RepoReviewError("Repository is too large.", 413));

    const response = await request(createGithubTestApp())
      .post("/api/github/repo-review")
      .set("Authorization", `Bearer ${bearerToken()}`)
      .send({ url: "https://github.com/example/project" });

    expect(response.status).toBe(413);
    expect(response.body).toEqual({ error: "Repository is too large." });
  });
});
