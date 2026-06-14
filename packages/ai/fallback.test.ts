jest.mock("./provider.js", () => {
  const providerMocks = {
    groqStreamReview: jest.fn(),
    geminiStreamReview: jest.fn(),
    groqStreamChat: jest.fn(),
    geminiStreamChat: jest.fn()
  };

  class AIProviderError extends Error {
    provider: string;
    statusCode: number | null;
    retryable: boolean;
    isTimeout: boolean;

    constructor(params: {
      provider: string;
      message: string;
      statusCode?: number | null;
      retryable?: boolean;
      isTimeout?: boolean;
    }) {
      super(params.message);
      this.provider = params.provider;
      this.statusCode = params.statusCode ?? null;
      this.retryable = params.retryable ?? false;
      this.isTimeout = params.isTimeout ?? false;
    }
  }

  return {
    AIProviderError,
    providerMocks,
    createGroqProvider: () => ({
      streamReview: providerMocks.groqStreamReview,
      streamChat: providerMocks.groqStreamChat
    }),
    createGeminiProvider: () => ({
      streamReview: providerMocks.geminiStreamReview,
      streamChat: providerMocks.geminiStreamChat
    })
  };
});

import { AIProviderError } from "./provider.js";
import { AIServiceUnavailableError, streamChatWithFailover, streamReviewWithFailover } from "./fallback";

const providerMocks = jest.requireMock("./provider.js").providerMocks as {
  groqStreamReview: jest.Mock;
  geminiStreamReview: jest.Mock;
  groqStreamChat: jest.Mock;
  geminiStreamChat: jest.Mock;
};

const reviewRequest = {
  language: "typescript",
  sourceCode: "const ok = true;",
  reviewId: "review-1"
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("streamReviewWithFailover", () => {
  it("returns Groq review responses when the primary provider succeeds", async () => {
    providerMocks.groqStreamReview.mockResolvedValue({
      providerUsed: "groq",
      modelUsed: "groq-model",
      issues: [],
      rawText: "[]",
      promptTokens: 10,
      completionTokens: 5
    });

    await expect(streamReviewWithFailover(reviewRequest)).resolves.toMatchObject({
      providerUsed: "groq"
    });
    expect(providerMocks.geminiStreamReview).not.toHaveBeenCalled();
  });

  it("fails over to Gemini for retryable Groq failures", async () => {
    providerMocks.groqStreamReview.mockRejectedValue(
      new AIProviderError({ provider: "groq", message: "rate limited", statusCode: 429, retryable: true })
    );
    providerMocks.geminiStreamReview.mockResolvedValue({
      providerUsed: "gemini",
      modelUsed: "gemini-model",
      issues: [],
      rawText: "[]",
      promptTokens: null,
      completionTokens: null
    });

    await expect(streamReviewWithFailover(reviewRequest)).resolves.toMatchObject({
      providerUsed: "gemini"
    });
  });

  it("queues the review when both providers fail", async () => {
    const queueForRetry = jest.fn();
    providerMocks.groqStreamReview.mockRejectedValue(
      new AIProviderError({ provider: "groq", message: "timeout", retryable: true, isTimeout: true })
    );
    providerMocks.geminiStreamReview.mockRejectedValue(
      new AIProviderError({ provider: "gemini", message: "unavailable", statusCode: 503, retryable: true })
    );

    await expect(streamReviewWithFailover(reviewRequest, {}, { queueForRetry })).rejects.toBeInstanceOf(
      AIServiceUnavailableError
    );
    expect(queueForRetry).toHaveBeenCalledWith(expect.objectContaining({ reviewId: "review-1" }));
  });
});

describe("streamChatWithFailover", () => {
  it("falls back for chat requests using the same provider policy", async () => {
    providerMocks.groqStreamChat.mockRejectedValue(
      new AIProviderError({ provider: "groq", message: "server error", statusCode: 500, retryable: true })
    );
    providerMocks.geminiStreamChat.mockResolvedValue({
      providerUsed: "gemini",
      modelUsed: "gemini-model",
      text: "Try strict equality.",
      promptTokens: null,
      completionTokens: null
    });

    await expect(streamChatWithFailover(reviewRequest)).resolves.toMatchObject({
      providerUsed: "gemini",
      text: "Try strict equality."
    });
  });
});
