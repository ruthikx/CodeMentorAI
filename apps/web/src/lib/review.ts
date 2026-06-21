export type ReviewSeverity = "style" | "best_practice" | "logic" | "security";

export interface ReviewIssue {
  id: string;
  reviewId: string;
  severity: ReviewSeverity;
  category: string;
  lineStart: number;
  lineEnd: number;
  title: string;
  explanation: string;
  suggestedFix: string;
  accepted: boolean;
}

export interface ReviewDetail {
  reviewId: string;
  status: "pending" | "processing" | "complete" | "failed";
  issues: ReviewIssue[];
  completedAt: string | null;
  submission: {
    id: string;
    language: string;
    filename: string | null;
    sourceCode: string;
    githubPrId: number | null;
    submittedAt: string;
  };
}

export interface SubmissionListResponse {
  submissions: Array<{
    id: string;
    language: string;
    filename: string | null;
    submittedAt: string;
    githubPrId: number | null;
    latestReviewId?: string | null;
  }>;
  total: number;
  page: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export function detectLanguage(sourceCode: string): string {
  const sample = sourceCode.slice(0, 200).toLowerCase();

  if (sample.includes("def ") && sample.includes("import ")) return "python";
  if (sample.includes("console.log") || sample.includes("function ") || sample.includes("=>")) return "javascript";
  if (sample.includes("interface ") || sample.includes(": string") || sample.includes("type ")) return "typescript";
  if (sample.includes("#include") || sample.includes("std::")) return "cpp";
  if (sample.includes("public class ") || sample.includes("system.out")) return "java";
  if (sample.includes("package main") || sample.includes("func main")) return "go";
  if (sample.includes("fn main") || sample.includes("let mut")) return "rust";
  if (sample.includes("<html") || sample.includes("</div>")) return "html";
  if (sample.includes("select ") || sample.includes(" from ")) return "sql";
  if (sample.includes("body {") || sample.includes("@media")) return "css";

  return "plaintext";
}

export function getSeverityMeta(severity: ReviewSeverity) {
  switch (severity) {
    case "style":
      return { label: "Style", icon: "i", colorClass: "text-signal.blue", surfaceClass: "bg-signal.blue/15 ring-signal.blue/35" };
    case "best_practice":
      return { label: "Best Practice", icon: "!", colorClass: "text-signal.yellow", surfaceClass: "bg-signal.yellow/15 ring-signal.yellow/35" };
    case "logic":
      return { label: "Logic Flaw", icon: "!!", colorClass: "text-signal.orange", surfaceClass: "bg-signal.orange/15 ring-signal.orange/35" };
    case "security":
      return { label: "Security", icon: "S", colorClass: "text-signal.red", surfaceClass: "bg-signal.red/15 ring-signal.red/35" };
  }
}

export function extractSnippet(sourceCode: string, lineStart: number, lineEnd: number, contextLines = 1): string {
  const lines = sourceCode.split("\n");
  const start = Math.max(0, lineStart - 1 - contextLines);
  const end = Math.min(lines.length, lineEnd + contextLines);
  return lines.slice(start, end).join("\n");
}

export interface AppliedFixResult {
  code: string;
  appliedCount: number;
  skippedIssues: ReviewIssue[];
}

export function applyAcceptedFixes(sourceCode: string, issues: ReviewIssue[]): AppliedFixResult {
  const acceptedIssues = issues
    .filter((issue) => issue.accepted)
    .sort((left, right) => {
      if (right.lineStart !== left.lineStart) {
        return right.lineStart - left.lineStart;
      }

      return right.lineEnd - left.lineEnd;
    });

  const lines = sourceCode.split("\n");
  const appliedRanges: Array<{ lineStart: number; lineEnd: number }> = [];
  const skippedIssues: ReviewIssue[] = [];

  for (const issue of acceptedIssues) {
    if (issue.lineStart < 1 || issue.lineEnd < issue.lineStart || issue.lineStart > lines.length) {
      skippedIssues.push(issue);
      continue;
    }

    const overlapsAppliedRange = appliedRanges.some(
      (range) => issue.lineStart <= range.lineEnd && issue.lineEnd >= range.lineStart
    );

    if (overlapsAppliedRange) {
      skippedIssues.push(issue);
      continue;
    }

    const startIndex = issue.lineStart - 1;
    const deleteCount = Math.min(issue.lineEnd, lines.length) - startIndex;
    const replacement = normalizeSuggestedFix(issue.suggestedFix);
    const replacementLines = replacement.length > 0 ? replacement.split("\n") : [];

    lines.splice(startIndex, deleteCount, ...replacementLines);
    appliedRanges.push({ lineStart: issue.lineStart, lineEnd: issue.lineEnd });
  }

  return {
    code: lines.join("\n"),
    appliedCount: acceptedIssues.length - skippedIssues.length,
    skippedIssues
  };
}

export function normalizeSuggestedFix(suggestedFix: string): string {
  const trimmed = stripMarkdownFence(suggestedFix.trim());
  const colonSeparatedCode = extractCodeAfterProsePrefix(trimmed);

  if (colonSeparatedCode) {
    return colonSeparatedCode;
  }

  return trimmed;
}

function stripMarkdownFence(value: string): string {
  return value
    .replace(/^```[a-zA-Z0-9_-]*\s*/u, "")
    .replace(/```$/u, "")
    .trim();
}

function extractCodeAfterProsePrefix(value: string): string | null {
  const prefixMatch = value.match(/\b(?:for example|e\.g\.|try this|use this|replace with)\s*:\s*/iu);
  if (!prefixMatch?.index) {
    return null;
  }

  const candidate = value.slice(prefixMatch.index + prefixMatch[0].length).trim();
  if (!looksLikeCode(candidate)) {
    return null;
  }

  return candidate;
}

function looksLikeCode(value: string): boolean {
  if (value.length === 0) {
    return false;
  }

  return /[(){}[\]=;<>]/u.test(value) || /^\s*(for|if|while|def|class|const|let|var|return|print|import|from)\b/u.test(value);
}

export function trimToApproxTokens(value: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (value.length <= maxChars) {
    return value;
  }

  return `${value.slice(0, maxChars)}\n...`;
}
