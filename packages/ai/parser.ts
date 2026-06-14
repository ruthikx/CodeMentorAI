import type { ReviewIssue, ReviewSeverity } from "@codementor-ai/types";

const VALID_SEVERITIES: readonly ReviewSeverity[] = [
  "style",
  "best_practice",
  "logic",
  "security"
] as const;

type ParsedIssuePayload = Pick<
  ReviewIssue,
  "severity" | "category" | "lineStart" | "lineEnd" | "title" | "explanation" | "suggestedFix"
>;

export interface ParseReviewIssueOptions {
  reviewId?: string;
}

export function parseReviewIssues(
  payload: string,
  options: ParseReviewIssueOptions = {}
): ReviewIssue[] {
  try {
    const normalized = extractJSONArray(payload);
    const parsed = JSON.parse(normalized) as unknown;

    if (!Array.isArray(parsed)) {
      throw new Error("AI response must be a JSON array of review issues.");
    }

    return parsed.map((entry) => buildReviewIssue(validateReviewIssue(entry), options.reviewId));
  } catch (error) {
    logParserError("Failed to parse AI review issues.", error, payload);
    return [];
  }
}

export class ReviewIssueStreamParser {
  private buffer = "";
  private scanIndex = 0;
  private seenArrayStart = false;
  private objectStart = -1;
  private objectDepth = 0;
  private inString = false;
  private escaped = false;

  push(chunk: string, options: ParseReviewIssueOptions = {}): ReviewIssue[] {
    this.buffer += chunk;
    const issues: ReviewIssue[] = [];

    while (this.scanIndex < this.buffer.length) {
      const character = this.buffer[this.scanIndex];

      if (!this.seenArrayStart) {
        if (character === "[") {
          this.seenArrayStart = true;
        }
        this.scanIndex += 1;
        continue;
      }

      if (this.objectStart === -1) {
        if (character === "{") {
          this.objectStart = this.scanIndex;
          this.objectDepth = 1;
          this.inString = false;
          this.escaped = false;
        }

        this.scanIndex += 1;
        continue;
      }

      if (this.escaped) {
        this.escaped = false;
        this.scanIndex += 1;
        continue;
      }

      if (character === "\\") {
        this.escaped = this.inString;
        this.scanIndex += 1;
        continue;
      }

      if (character === "\"") {
        this.inString = !this.inString;
        this.scanIndex += 1;
        continue;
      }

      if (!this.inString) {
        if (character === "{") {
          this.objectDepth += 1;
        } else if (character === "}") {
          this.objectDepth -= 1;

          if (this.objectDepth === 0) {
            const objectText = this.buffer.slice(this.objectStart, this.scanIndex + 1);
            const parsed = JSON.parse(objectText) as unknown;
            issues.push(buildReviewIssue(validateReviewIssue(parsed), options.reviewId));
            this.objectStart = -1;
          }
        }
      }

      this.scanIndex += 1;
    }

    return issues;
  }

  flush(options: ParseReviewIssueOptions = {}): ReviewIssue[] {
    if (this.objectStart !== -1) {
      return [];
    }

    const trimmed = this.buffer.trim();
    if (trimmed.length === 0 || !trimmed.includes("[")) {
      return [];
    }

    return parseReviewIssues(trimmed, options);
  }
}

export function validateReviewIssue(input: unknown): ParsedIssuePayload {
  if (!isRecord(input)) {
    throw new Error("Each review issue must be a JSON object.");
  }

  const severityValue = input.severity;
  if (typeof severityValue !== "string" || !VALID_SEVERITIES.includes(severityValue as ReviewSeverity)) {
    throw new Error(`Invalid review issue severity: ${String(severityValue)}`);
  }
  const severity = severityValue as ReviewSeverity;

  const category = expectNonEmptyString(input.category, "category");
  const title = expectNonEmptyString(input.title, "title");
  const explanation = expectNonEmptyString(input.explanation, "explanation");
  const suggestedFix = expectString(input.suggestedFix, "suggestedFix");
  const lineStart = expectPositiveInteger(input.lineStart, "lineStart");
  const lineEnd = expectPositiveInteger(input.lineEnd, "lineEnd");

  if (lineEnd < lineStart) {
    throw new Error("Review issue lineEnd must be greater than or equal to lineStart.");
  }

  return {
    severity,
    category,
    lineStart,
    lineEnd,
    title,
    explanation,
    suggestedFix
  };
}

function buildReviewIssue(input: ParsedIssuePayload, reviewId?: string): ReviewIssue {
  return {
    id: crypto.randomUUID(),
    reviewId: reviewId ?? "",
    accepted: false,
    ...input
  };
}

function extractJSONArray(payload: string): string {
  const trimmed = payload.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const arrayStart = trimmed.indexOf("[");
  const arrayEnd = trimmed.lastIndexOf("]");

  if (arrayStart === -1 || arrayEnd === -1 || arrayEnd < arrayStart) {
    throw new Error("AI response did not contain a JSON array.");
  }

  return trimmed.slice(arrayStart, arrayEnd + 1);
}

function expectPositiveInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new Error(`Review issue ${field} must be a positive integer.`);
  }

  return value;
}

function expectNonEmptyString(value: unknown, field: string): string {
  const parsed = expectString(value, field).trim();
  if (parsed.length === 0) {
    throw new Error(`Review issue ${field} must be a non-empty string.`);
  }

  return parsed;
}

function expectString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`Review issue ${field} must be a string.`);
  }

  return value;
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null;
}

function logParserError(message: string, error: unknown, payload: string): void {
  const payloadPreview = payload.length > 500 ? `${payload.slice(0, 500)}...` : payload;
  console.error(message, {
    error: error instanceof Error ? error.message : String(error),
    payloadPreview
  });
}
