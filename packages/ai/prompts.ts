import type { ReviewIssue } from "@codementor-ai/types";

const DEFAULT_REVIEW_ISSUE_LIMIT = 5;
const DEFAULT_SOURCE_TOKEN_LIMIT = 8_000;
const CHARS_PER_TOKEN = 4;
const FOLLOW_UP_HISTORY_TOKEN_LIMIT = 16_000;
const DEFAULT_REPO_REVIEW_TOKEN_LIMIT = 18_000;

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

export interface RepoReviewPromptInput {
  repoUrl: string;
  repoName: string;
  defaultBranch: string;
  focus?: string;
  fileTree: string;
  languages: string[];
  filesScanned: number;
  sourceContext: string;
  maxFindings?: number;
}

export const REVIEW_SYSTEM_PROMPT =
  'You are a senior software engineer reviewing code written by a junior developer. Your goal is to teach, not just fix. Stay encouraging, explain the "why" behind each issue, avoid undefined jargon, and stay focused on the supplied code context. Do not hallucinate file contents or project structure that are not present in the prompt. Return only valid JSON: an array of up to five ReviewIssue objects with the fields severity, category, lineStart, lineEnd, title, explanation, and suggestedFix. The severity field must be exactly one of: style, best_practice, logic, security. The suggestedFix field must contain replacement code only, with no prose, labels, prefixes, Markdown fences, or phrases like "for example". suggestedFix must be a complete syntactically valid replacement for exactly the lines from lineStart through lineEnd, preserving indentation and any surrounding function/class structure needed inside that range.';

export const REVIEW_CHAT_SYSTEM_PROMPT =
  'You are a senior software engineer coaching a junior developer about a code review. Stay focused on the supplied code, issue context, and conversation history. Explain clearly, avoid undefined jargon, do not hallucinate missing files, and answer in helpful plain English.';

export const REPO_REVIEW_SYSTEM_PROMPT =
  "You are a senior software engineer performing a repository code review. Stay grounded only in the file tree and source excerpts provided. Do not claim to have run, built, installed, tested, or executed the repository. Return only valid JSON matching the requested schema. Findings must be specific, actionable, and include an exact file path plus a line number when the evidence appears in a supplied numbered excerpt. Avoid vague feedback.";

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
        "For every issue, lineStart and lineEnd must identify the exact source lines replaced by suggestedFix.",
        "Do not suggest a fix if it cannot be represented as a syntactically valid replacement for that exact line range.",
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

export function buildRepoReviewMessages(input: RepoReviewPromptInput): AIMessage[] {
  const focus = input.focus?.trim();
  const maxFindings = input.maxFindings ?? 8;
  const sourceContext = truncateToApproxTokens(input.sourceContext, DEFAULT_REPO_REVIEW_TOKEN_LIMIT);

  return [
    { role: "system", content: REPO_REVIEW_SYSTEM_PROMPT },
    {
      role: "user",
      content: [
        "Review this public GitHub repository from static source excerpts only.",
        "",
        "Return exactly one JSON object with this schema:",
        "{",
        '  "summary": "string",',
        '  "repo": { "url": "string", "name": "string", "defaultBranch": "string" },',
        '  "stats": { "filesScanned": number, "languages": ["string"] },',
        '  "findings": [',
        '    {',
        '      "severity": "critical | high | medium | low",',
        '      "title": "string",',
        '      "file": "string",',
        '      "line": number | null,',
        '      "description": "string",',
        '      "recommendation": "string",',
        '      "fix": null | { "lineStart": number, "lineEnd": number, "replacement": "string", "patch": null }',
        "    }",
        "  ],",
        '  "nextSteps": ["string"]',
        "}",
        "",
        "Review rules:",
        `- Include up to ${maxFindings} findings, ordered by severity and impact.`,
        "- Use severity exactly as critical, high, medium, or low.",
        "- Cover bugs, security risks, maintainability, missing tests, performance, and architecture concerns when evidence exists.",
        "- Every finding must explain why it matters and suggest a concrete fix.",
        "- Use null for line only when no exact supplied line supports the finding.",
        "- For every finding with a numeric line, include a fix object whenever a direct code edit can reasonably address the issue.",
        "- Prefer a small, concrete edit over a broad rewrite. Replacing one unsafe line is better than returning fix null.",
        "- fix.lineStart and fix.lineEnd must identify the exact original lines to replace.",
        "- fix.replacement must contain replacement code only, preserving indentation, with no prose, labels, comments about the fix, or Markdown fences.",
        "- If a fix needs an import or env lookup, include the smallest contiguous line range that makes the file syntactically valid when replaced.",
        "- Set fix to null only when the correction truly needs unseen context, multiple files, broad refactoring, a new dependency, or a new file.",
        "- Set fix.patch to null; the API will generate downloadable patches after validating the replacement against the fetched source.",
        "- Example for a hardcoded secret on line 3: fix should replace line 3 with code that reads from an environment variable, not return null.",
        "- Do not include Markdown fences or text outside the JSON object.",
        focus ? `- User review focus: ${focus}` : "- User review focus: general repo health.",
        "",
        "Repository metadata:",
        `URL: ${input.repoUrl}`,
        `Name: ${input.repoName}`,
        `Default branch: ${input.defaultBranch}`,
        `Files scanned: ${input.filesScanned}`,
        `Detected languages/frameworks: ${input.languages.join(", ") || "unknown"}`,
        "",
        "File tree summary:",
        input.fileTree,
        "",
        "Numbered source excerpts:",
        sourceContext
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
