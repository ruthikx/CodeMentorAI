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

export function extractSnippet(sourceCode: string, lineStart: number, lineEnd: number): string {
  const lines = sourceCode.split("\n");
  const start = Math.max(0, lineStart - 2);
  const end = Math.min(lines.length, lineEnd + 1);
  return lines.slice(start, end).join("\n");
}

export function trimToApproxTokens(value: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (value.length <= maxChars) {
    return value;
  }

  return `${value.slice(0, maxChars)}\n...`;
}
