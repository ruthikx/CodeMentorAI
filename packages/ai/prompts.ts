import type { ReviewIssue } from "@codementor-ai/types";

const DEFAULT_REVIEW_ISSUE_LIMIT = 5;
const DEFAULT_SOURCE_TOKEN_LIMIT = 8_000;
const CHARS_PER_TOKEN = 4;
const FOLLOW_UP_HISTORY_TOKEN_LIMIT = 16_000;

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ReviewPromptInput {
  language: string;
  sourceCode: string;
  maxIssues?: number;
}

export interface ReviewChatContextInput extends ReviewPromptInput {
  conversationHistory?: AIMessage[];
  issue?: Pick<
    ReviewIssue,
    "severity" | "category" | "lineStart" | "lineEnd" | "title" | "explanation" | "suggestedFix"
  > | null;
  message?: string;
}

export const REVIEW_SYSTEM_PROMPT =
  'You are a senior software engineer reviewing code written by a junior developer. Your goal is to teach, not just fix. Stay encouraging, explain the "why" behind each issue, avoid undefined jargon, and stay focused on the supplied code context. Do not hallucinate file contents or project structure that are not present in the prompt. Return only valid JSON: an array of up to five ReviewIssue objects with the fields severity, category, lineStart, lineEnd, title, explanation, and suggestedFix. The severity field must be exactly one of: style, best_practice, logic, security.';

export const REVIEW_CHAT_SYSTEM_PROMPT =
  'You are a senior software engineer coaching a junior developer about a code review. Stay focused on the supplied code, issue context, and conversation history. Explain clearly, avoid undefined jargon, do not hallucinate missing files, and answer in helpful plain English.';

export function buildReviewMessages(input: ReviewPromptInput): AIMessage[] {
  const maxIssues = input.maxIssues ?? DEFAULT_REVIEW_ISSUE_LIMIT;
  const normalizedLanguage = normalizeLanguage(input.language);
  const truncatedSource = truncateToApproxTokens(input.sourceCode, DEFAULT_SOURCE_TOKEN_LIMIT);

  return [
    { role: "system", content: REVIEW_SYSTEM_PROMPT },
    {
      role: "user",
      content: [
        `Programming language: ${normalizedLanguage}`,
        `Review up to ${maxIssues} of the most impactful issues only.`,
        "Prioritize issues that materially improve correctness, maintainability, performance, or security.",
        "Return a JSON array only. Do not wrap it in Markdown fences.",
        "",
        "Source code:",
        "```",
        truncatedSource,
        "```"
      ].join("\n")
    }
  ];
}

export function buildReviewChatMessages(input: ReviewChatContextInput): AIMessage[] {
  const baseMessages = buildReviewMessages(input);
  const history = trimConversationHistory(
    input.conversationHistory ?? [],
    FOLLOW_UP_HISTORY_TOKEN_LIMIT
  );

  if (!input.issue) {
    return [...baseMessages, ...history];
  }

  const issueMessage: AIMessage = {
    role: "user",
    content: [
      "Current review issue under discussion:",
      JSON.stringify(input.issue, null, 2),
      "",
      "When answering follow-up questions, stay grounded in the source code and this issue."
    ].join("\n")
  };

  return [...baseMessages, issueMessage, ...history];
}

export function buildIssueChatMessages(input: ReviewChatContextInput): AIMessage[] {
  const normalizedLanguage = normalizeLanguage(input.language);
  const truncatedSource = truncateToApproxTokens(input.sourceCode, DEFAULT_SOURCE_TOKEN_LIMIT);
  const history = trimConversationHistory(input.conversationHistory ?? [], FOLLOW_UP_HISTORY_TOKEN_LIMIT);

  const issueBlock = input.issue
    ? `Current review issue:\n${JSON.stringify(input.issue, null, 2)}`
    : "Current review issue: none provided.";

  const latestMessage = input.message?.trim() || "Help me understand this review.";

  return [
    { role: "system", content: REVIEW_CHAT_SYSTEM_PROMPT },
    {
      role: "user",
      content: [
        `Programming language: ${normalizedLanguage}`,
        issueBlock,
        "",
        "Source code:",
        "```",
        truncatedSource,
        "```"
      ].join("\n")
    },
    ...history,
    {
      role: "user",
      content: latestMessage
    }
  ];
}

export function truncateToApproxTokens(input: string, maxTokens: number): string {
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  if (input.length <= maxChars) {
    return input;
  }

  return `${input.slice(0, maxChars)}\n/* Truncated to approximately ${maxTokens} tokens for AI context. */`;
}

function trimConversationHistory(messages: AIMessage[], maxTokens: number): AIMessage[] {
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  const selected: AIMessage[] = [];
  let totalChars = 0;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const candidate = messages[index];
    const nextChars = totalChars + candidate.content.length;
    if (selected.length > 0 && nextChars > maxChars) {
      break;
    }

    selected.unshift(candidate);
    totalChars = nextChars;
  }

  return selected;
}

function normalizeLanguage(language: string): string {
  const normalized = language.trim();
  return normalized.length > 0 ? normalized : "unknown";
}
