import type { ReviewProvider } from "@codementor-ai/types";
import {
  AIProviderError,
  type AIChatResponse,
  type AIProviderHandlers,
  type AIProviderResponse,
  type AIReviewRequest,
  createGeminiProvider,
  createGroqProvider
} from "./provider.js";

const DEFAULT_PROVIDER_TIMEOUT_MS = Number.parseInt(
  process.env.AI_PROVIDER_TIMEOUT_MS ?? "8000",
  10
);

let groqErrorCount = 0;

export interface FailoverLogger {
  info?: (message: string, context?: Record<string, unknown>) => void;
  warn?: (message: string, context?: Record<string, unknown>) => void;
  error?: (message: string, context?: Record<string, unknown>) => void;
}

export interface FailoverOptions {
  timeoutMs?: number;
  logger?: FailoverLogger;
  queueForRetry?: (request: AIReviewRequest) => void | Promise<void>;
}

export class AIServiceUnavailableError extends Error {
  readonly statusCode = 503;
  readonly shouldQueueRetry = true;

  constructor(message = "All AI providers failed. The review should be queued for retry.") {
    super(message);
    this.name = "AIServiceUnavailableError";
  }
}

export async function streamReviewWithFailover(
  request: AIReviewRequest,
  handlers: AIProviderHandlers = {},
  options: FailoverOptions = {}
): Promise<AIProviderResponse> {
  const logger = options.logger ?? console;
  const timeoutMs = options.timeoutMs ?? DEFAULT_PROVIDER_TIMEOUT_MS;
  const groqProvider = createGroqProvider();
  const geminiProvider = createGeminiProvider();
  const hydratedRequest = { ...request, timeoutMs };
  const emittedIssueKeys = new Set<string>();
  const wrappedHandlers: AIProviderHandlers = {
    onTextDelta: handlers.onTextDelta,
    onIssue: async (issue) => {
      const key = `${issue.severity}:${issue.category}:${issue.lineStart}:${issue.lineEnd}:${issue.title}`;
      if (emittedIssueKeys.has(key)) {
        return;
      }

      emittedIssueKeys.add(key);
      await handlers.onIssue?.(issue);
    }
  };

  try {
    const groqResponse = await groqProvider.streamReview(hydratedRequest, wrappedHandlers);
    logger.info?.("AI review served by Groq.", buildLogContext("groq", groqResponse.providerUsed));
    return groqResponse;
  } catch (error) {
    const groqError = normalizeProviderError(error, "groq");
    groqErrorCount += 1;
    logger.warn?.("Groq failed, retrying review with Gemini.", {
      provider: groqError.provider,
      message: groqError.message,
      statusCode: groqError.statusCode,
      retryable: groqError.retryable,
      isTimeout: groqError.isTimeout,
      groqErrorCount
    });
  }

  try {
    const geminiResponse = await geminiProvider.streamReview(hydratedRequest, wrappedHandlers);
    logger.info?.("AI review served by Gemini after Groq failover.", buildLogContext("groq", geminiResponse.providerUsed));
    return geminiResponse;
  } catch (error) {
    const geminiError = normalizeProviderError(error, "gemini");
    logger.error?.("Gemini failed after Groq failover; request should be queued.", {
      provider: geminiError.provider,
      message: geminiError.message,
      statusCode: geminiError.statusCode,
      retryable: geminiError.retryable,
      isTimeout: geminiError.isTimeout
    });

    await options.queueForRetry?.(hydratedRequest);
    throw new AIServiceUnavailableError();
  }
}

export async function streamChatWithFailover(
  request: AIReviewRequest,
  handlers: AIProviderHandlers = {},
  options: FailoverOptions = {}
): Promise<AIChatResponse> {
  const logger = options.logger ?? console;
  const timeoutMs = options.timeoutMs ?? DEFAULT_PROVIDER_TIMEOUT_MS;
  const groqProvider = createGroqProvider();
  const geminiProvider = createGeminiProvider();
  const hydratedRequest = { ...request, timeoutMs };

  try {
    const groqResponse = await groqProvider.streamChat(hydratedRequest, handlers);
    logger.info?.("AI chat served by Groq.", buildLogContext("groq", groqResponse.providerUsed));
    return groqResponse;
  } catch (error) {
    const groqError = normalizeProviderError(error, "groq");
    groqErrorCount += 1;
    logger.warn?.("Groq failed, retrying chat with Gemini.", {
      provider: groqError.provider,
      message: groqError.message,
      statusCode: groqError.statusCode,
      retryable: groqError.retryable,
      isTimeout: groqError.isTimeout,
      groqErrorCount
    });
  }

  try {
    const geminiResponse = await geminiProvider.streamChat(hydratedRequest, handlers);
    logger.info?.("AI chat served by Gemini after Groq failover.", buildLogContext("groq", geminiResponse.providerUsed));
    return geminiResponse;
  } catch (error) {
    const geminiError = normalizeProviderError(error, "gemini");
    logger.error?.("Gemini failed after Groq failover; chat should be queued.", {
      provider: geminiError.provider,
      message: geminiError.message,
      statusCode: geminiError.statusCode,
      retryable: geminiError.retryable,
      isTimeout: geminiError.isTimeout
    });

    await options.queueForRetry?.(hydratedRequest);
    throw new AIServiceUnavailableError();
  }
}

export function getGroqErrorCount(): number {
  return groqErrorCount;
}

function normalizeProviderError(error: unknown, provider: ReviewProvider): AIProviderError {
  if (error instanceof AIProviderError) {
    return error;
  }

  return new AIProviderError({
    provider,
    message: error instanceof Error ? error.message : String(error),
    retryable: false
  });
}

function buildLogContext(
  initialProvider: ReviewProvider,
  servedBy: ReviewProvider
): Record<string, unknown> {
  return {
    initialProvider,
    servedBy
  };
}
