import type { ReviewIssue, ReviewProvider } from "@codementor-ai/types";
import { ReviewIssueStreamParser, parseReviewIssues } from "./parser.js";
import {
  buildIssueChatMessages,
  buildReviewChatMessages,
  buildReviewMessages,
  type AIMessage
} from "./prompts.js";

export const GROQ_MODEL = "llama-3.3-70b-versatile";
export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export interface AIReviewRequest {
  language: string;
  sourceCode: string;
  message?: string;
  reviewId?: string;
  issue?: Pick<
    ReviewIssue,
    "severity" | "category" | "lineStart" | "lineEnd" | "title" | "explanation" | "suggestedFix"
  > | null;
  conversationHistory?: AIMessage[];
  maxIssues?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface AIProviderHandlers {
  onIssue?: (issue: ReviewIssue) => void | Promise<void>;
  onTextDelta?: (delta: string) => void | Promise<void>;
}

export interface AIChatResponse {
  providerUsed: ReviewProvider;
  modelUsed: string;
  text: string;
  promptTokens: number | null;
  completionTokens: number | null;
}

export interface AIProviderResponse {
  providerUsed: ReviewProvider;
  modelUsed: string;
  issues: ReviewIssue[];
  rawText: string;
  promptTokens: number | null;
  completionTokens: number | null;
}

export interface AIProvider {
  readonly name: ReviewProvider;
  readonly model: string;
  streamReview(request: AIReviewRequest, handlers?: AIProviderHandlers): Promise<AIProviderResponse>;
  streamChat(request: AIReviewRequest, handlers?: AIProviderHandlers): Promise<AIChatResponse>;
}

export class AIProviderError extends Error {
  readonly provider: ReviewProvider;
  readonly statusCode: number | null;
  readonly retryable: boolean;
  readonly isTimeout: boolean;

  constructor(params: {
    provider: ReviewProvider;
    message: string;
    statusCode?: number | null;
    retryable?: boolean;
    isTimeout?: boolean;
  }) {
    super(params.message);
    this.name = "AIProviderError";
    this.provider = params.provider;
    this.statusCode = params.statusCode ?? null;
    this.retryable = params.retryable ?? false;
    this.isTimeout = params.isTimeout ?? false;
  }
}

export function createGroqProvider(): AIProvider {
  return new GroqAIProvider();
}

export function createGeminiProvider(): AIProvider {
  return new GeminiAIProvider();
}

class GroqAIProvider implements AIProvider {
  readonly name = "groq" as const;
  readonly model = GROQ_MODEL;

  async streamReview(
    request: AIReviewRequest,
    handlers: AIProviderHandlers = {}
  ): Promise<AIProviderResponse> {
    const messages = buildReviewMessages(request);
    return this.streamStructuredResponse(messages, request, handlers);
  }

  async streamChat(
    request: AIReviewRequest,
    handlers: AIProviderHandlers = {}
  ): Promise<AIChatResponse> {
    const messages = buildIssueChatMessages(request);
    return this.streamTextResponse(messages, request, handlers);
  }

  private async streamStructuredResponse(
    messages: AIMessage[],
    request: AIReviewRequest,
    handlers: AIProviderHandlers
  ): Promise<AIProviderResponse> {
    const apiKey = getRequiredEnv("GROQ_API_KEY", this.name);
    const body = {
      model: this.model,
      stream: true,
      temperature: 0.2,
      max_completion_tokens: 1400,
      messages
    };

    const response = await fetchWithTimeout(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(body),
      signal: request.signal,
      timeoutMs: request.timeoutMs
    }, this.name);

    if (!response.ok || !response.body) {
      throw await buildResponseError(this.name, response);
    }

    const parser = new ReviewIssueStreamParser();
    const streamedIssues = new Map<string, ReviewIssue>();
    let rawText = "";
    let promptTokens: number | null = null;
    let completionTokens: number | null = null;

    for await (const event of iterateSSE(response.body)) {
      if (event === "[DONE]") {
        break;
      }

      const payload = JSON.parse(event) as GroqStreamPayload;
      const delta = payload.choices?.[0]?.delta?.content ?? "";
      if (delta.length > 0) {
        rawText += delta;
        await handlers.onTextDelta?.(delta);

        const issues = parser.push(delta, { reviewId: request.reviewId });
        for (const issue of issues) {
          streamedIssues.set(issue.id, issue);
          await handlers.onIssue?.(issue);
        }
      }

      if (payload.usage) {
        promptTokens = payload.usage.prompt_tokens ?? promptTokens;
        completionTokens = payload.usage.completion_tokens ?? completionTokens;
      }
    }

    const issues = finalizeIssues(rawText, streamedIssues, request.reviewId);

    return {
      providerUsed: this.name,
      modelUsed: this.model,
      issues,
      rawText,
      promptTokens,
      completionTokens
    };
  }

  private async streamTextResponse(
    messages: AIMessage[],
    request: AIReviewRequest,
    handlers: AIProviderHandlers
  ): Promise<AIChatResponse> {
    const apiKey = getRequiredEnv("GROQ_API_KEY", this.name);
    const body = {
      model: this.model,
      stream: true,
      temperature: 0.2,
      max_completion_tokens: 1400,
      messages
    };

    const response = await fetchWithTimeout(
      GROQ_API_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(body),
        signal: request.signal,
        timeoutMs: request.timeoutMs
      },
      this.name
    );

    if (!response.ok || !response.body) {
      throw await buildResponseError(this.name, response);
    }

    let text = "";
    let promptTokens: number | null = null;
    let completionTokens: number | null = null;

    for await (const event of iterateSSE(response.body)) {
      if (event === "[DONE]") {
        break;
      }

      const payload = JSON.parse(event) as GroqStreamPayload;
      const delta = payload.choices?.[0]?.delta?.content ?? "";
      if (delta.length > 0) {
        text += delta;
        await handlers.onTextDelta?.(delta);
      }

      if (payload.usage) {
        promptTokens = payload.usage.prompt_tokens ?? promptTokens;
        completionTokens = payload.usage.completion_tokens ?? completionTokens;
      }
    }

    return {
      providerUsed: this.name,
      modelUsed: this.model,
      text,
      promptTokens,
      completionTokens
    };
  }
}

class GeminiAIProvider implements AIProvider {
  readonly name = "gemini" as const;
  readonly model = GEMINI_MODEL;

  async streamReview(
    request: AIReviewRequest,
    handlers: AIProviderHandlers = {}
  ): Promise<AIProviderResponse> {
    const messages = buildReviewMessages(request);
    return this.streamStructuredResponse(messages, request, handlers);
  }

  async streamChat(
    request: AIReviewRequest,
    handlers: AIProviderHandlers = {}
  ): Promise<AIChatResponse> {
    const messages = buildIssueChatMessages(request);
    return this.streamTextResponse(messages, request, handlers);
  }

  private async streamStructuredResponse(
    messages: AIMessage[],
    request: AIReviewRequest,
    handlers: AIProviderHandlers
  ): Promise<AIProviderResponse> {
    const apiKey = getRequiredEnv("GEMINI_API_KEY", this.name);
    const [systemMessage, ...conversation] = messages;
    const body = {
      systemInstruction: {
        parts: [{ text: systemMessage?.content ?? "" }]
      },
      contents: conversation.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }]
      })),
      generationConfig: {
        temperature: 0.2
      }
    };

    const response = await fetchWithTimeout(
      getGeminiApiUrl(this.model),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify(body),
        signal: request.signal,
        timeoutMs: request.timeoutMs
      },
      this.name
    );

    if (!response.ok || !response.body) {
      throw await buildResponseError(this.name, response);
    }

    const parser = new ReviewIssueStreamParser();
    const streamedIssues = new Map<string, ReviewIssue>();
    let rawText = "";
    let promptTokens: number | null = null;
    let completionTokens: number | null = null;

    for await (const event of iterateSSE(response.body)) {
      const payload = JSON.parse(event) as GeminiStreamPayload;
      const delta = payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("") ?? "";

      if (delta.length > 0) {
        rawText += delta;
        await handlers.onTextDelta?.(delta);

        const issues = parser.push(delta, { reviewId: request.reviewId });
        for (const issue of issues) {
          streamedIssues.set(issue.id, issue);
          await handlers.onIssue?.(issue);
        }
      }

      if (payload.usageMetadata) {
        promptTokens = payload.usageMetadata.promptTokenCount ?? promptTokens;
        completionTokens = payload.usageMetadata.candidatesTokenCount ?? completionTokens;
      }
    }

    const issues = finalizeIssues(rawText, streamedIssues, request.reviewId);

    return {
      providerUsed: this.name,
      modelUsed: this.model,
      issues,
      rawText,
      promptTokens,
      completionTokens
    };
  }

  private async streamTextResponse(
    messages: AIMessage[],
    request: AIReviewRequest,
    handlers: AIProviderHandlers
  ): Promise<AIChatResponse> {
    const apiKey = getRequiredEnv("GEMINI_API_KEY", this.name);
    const [systemMessage, ...conversation] = messages;
    const body = {
      systemInstruction: {
        parts: [{ text: systemMessage?.content ?? "" }]
      },
      contents: conversation.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }]
      })),
      generationConfig: {
        temperature: 0.2
      }
    };

    const response = await fetchWithTimeout(
      getGeminiApiUrl(this.model),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify(body),
        signal: request.signal,
        timeoutMs: request.timeoutMs
      },
      this.name
    );

    if (!response.ok || !response.body) {
      throw await buildResponseError(this.name, response);
    }

    let text = "";
    let promptTokens: number | null = null;
    let completionTokens: number | null = null;

    for await (const event of iterateSSE(response.body)) {
      const payload = JSON.parse(event) as GeminiStreamPayload;
      const delta = payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("") ?? "";

      if (delta.length > 0) {
        text += delta;
        await handlers.onTextDelta?.(delta);
      }

      if (payload.usageMetadata) {
        promptTokens = payload.usageMetadata.promptTokenCount ?? promptTokens;
        completionTokens = payload.usageMetadata.candidatesTokenCount ?? completionTokens;
      }
    }

    return {
      providerUsed: this.name,
      modelUsed: this.model,
      text,
      promptTokens,
      completionTokens
    };
  }
}

function finalizeIssues(
  rawText: string,
  streamedIssues: Map<string, ReviewIssue>,
  reviewId?: string
): ReviewIssue[] {
  if (rawText.trim().length === 0) {
    return [];
  }

  const parsedIssues = parseReviewIssues(rawText, { reviewId });
  if (streamedIssues.size === 0) {
    return parsedIssues;
  }

  return parsedIssues.map((issue) => {
    const match = [...streamedIssues.values()].find(
      (candidate) =>
        candidate.title === issue.title &&
        candidate.lineStart === issue.lineStart &&
        candidate.lineEnd === issue.lineEnd
    );

    return match ?? issue;
  });
}

function getGeminiApiUrl(model: string): string {
  return `${GEMINI_API_BASE_URL}/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit & { timeoutMs?: number },
  provider: ReviewProvider
): Promise<Response> {
  const controller = new AbortController();
  const signal = mergeAbortSignals(controller, init.signal);
  const timeoutMs = init.timeoutMs;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  if (typeof timeoutMs === "number" && timeoutMs > 0) {
    timeoutId = setTimeout(() => controller.abort(new Error("timeout")), timeoutMs);
  }

  try {
    return await fetch(url, { ...init, signal });
  } catch (error) {
    if (isAbortError(error)) {
      throw new AIProviderError({
        provider,
        message: `${provider} request timed out or was aborted.`,
        retryable: true,
        isTimeout: true
      });
    }

    throw new AIProviderError({
      provider,
      message: `${provider} request failed: ${toErrorMessage(error)}`,
      retryable: true
    });
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function buildResponseError(
  provider: ReviewProvider,
  response: Response
): Promise<AIProviderError> {
  const rawBody = await response.text();
  return new AIProviderError({
    provider,
    message: `${provider} request failed with status ${response.status}: ${rawBody}`,
    statusCode: response.status,
    retryable: response.status === 429 || response.status >= 500
  });
}

async function* iterateSSE(stream: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    let boundaryIndex = findSSEBoundary(buffer);

    while (boundaryIndex !== -1) {
      const rawEvent = buffer.slice(0, boundaryIndex);
      const separatorLength = buffer.startsWith("\r\n\r\n", boundaryIndex) ? 4 : 2;
      buffer = buffer.slice(boundaryIndex + separatorLength);
      boundaryIndex = findSSEBoundary(buffer);

      const event = parseSSEEvent(rawEvent);
      if (event) {
        yield event;
      }
    }
  }

  buffer += decoder.decode();
  const trailingEvent = parseSSEEvent(buffer);
  if (trailingEvent) {
    yield trailingEvent;
  }
}

function parseSSEEvent(rawEvent: string): string | null {
  const lines = rawEvent
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart());

  if (lines.length === 0) {
    return null;
  }

  return lines.join("\n");
}

function getRequiredEnv(name: string, provider: ReviewProvider): string {
  const value = process.env[name];
  if (!value) {
    throw new AIProviderError({
      provider,
      message: `Missing required environment variable ${name}.`,
      retryable: false
    });
  }

  return value;
}

function mergeAbortSignals(
  controller: AbortController,
  secondary?: AbortSignal | null
): AbortSignal {
  const primary = controller.signal;
  if (!secondary) {
    return primary;
  }

  if (secondary.aborted) {
    controller.abort(secondary.reason);
    return primary;
  }

  secondary.addEventListener("abort", () => controller.abort(secondary.reason), {
    once: true
  });

  return primary;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === "AbortError" || error.message === "timeout");
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function findSSEBoundary(buffer: string): number {
  const unixBoundary = buffer.indexOf("\n\n");
  const windowsBoundary = buffer.indexOf("\r\n\r\n");

  if (unixBoundary === -1) {
    return windowsBoundary;
  }

  if (windowsBoundary === -1) {
    return unixBoundary;
  }

  return Math.min(unixBoundary, windowsBoundary);
}

interface GroqStreamPayload {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
}

interface GeminiStreamPayload {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
}
