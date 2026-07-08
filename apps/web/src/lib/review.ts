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
  const sample = sourceCode.slice(0, 5000);
  const candidates: Array<{ language: string; score: number; priority: number }> = [
    {
      language: "python",
      score: scoreLanguage(sample, [
        [/^\s*(?:async\s+)?def\s+\w+\s*\(/mu, 5],
        [/^\s*class\s+\w+(?:\([^)]*\))?:\s*$/mu, 4],
        [/^\s*(?:from\s+[\w.]+\s+import|import\s+\w+)/mu, 3],
        [/^\s*if\s+__name__\s*==\s*["']__main__["']\s*:/mu, 4],
        [/^\s*(?:if|elif|else|for|while|try|except|finally|with)\b.*:\s*$/mu, 2],
        [/\bprint\s*\(/u, 2],
        [/\brange\s*\(/u, 1],
        [/\bself\b/u, 1]
      ]),
      priority: 9
    },
    {
      language: "typescript",
      score: scoreLanguage(sample, [
        [/^\s*interface\s+\w+/mu, 6],
        [/^\s*type\s+\w+\s*=/mu, 5],
        [/\bimport\s+type\b/u, 4],
        [/\benum\s+\w+/u, 4],
        [/\b(?:public|private|protected|readonly)\s+\w+/u, 2],
        [/:\s*(?:string|number|boolean|unknown|any|void|never|Promise<|Array<|Record<)/u, 4],
        [/\)\s*:\s*[A-Z]\w*/u, 3],
        [/\bas\s+const\b/u, 2]
      ]),
      priority: 8
    },
    {
      language: "java",
      score: scoreLanguage(sample, [
        [/^\s*public\s+(?:final\s+)?class\s+\w+/mu, 6],
        [/\bpublic\s+static\s+void\s+main\s*\(/u, 6],
        [/\bSystem\.out\.print/u, 5],
        [/^\s*import\s+java\./mu, 4],
        [/\bString\[\]\s+\w+/u, 3]
      ]),
      priority: 7
    },
    {
      language: "go",
      score: scoreLanguage(sample, [
        [/^\s*package\s+main\b/mu, 5],
        [/^\s*func\s+\w+\s*\(/mu, 4],
        [/\bfmt\.Print/u, 3],
        [/:=/u, 2]
      ]),
      priority: 7
    },
    {
      language: "rust",
      score: scoreLanguage(sample, [
        [/^\s*fn\s+\w+\s*\(/mu, 5],
        [/\bprintln!\s*\(/u, 4],
        [/\blet\s+mut\b/u, 3],
        [/^\s*use\s+[\w:]+;/mu, 3]
      ]),
      priority: 7
    },
    {
      language: "cpp",
      score: scoreLanguage(sample, [
        [/^\s*#include\s*</mu, 5],
        [/\bstd::/u, 4],
        [/\bcout\s*<</u, 3],
        [/\bint\s+main\s*\(/u, 2]
      ]),
      priority: 7
    },
    {
      language: "html",
      score: scoreLanguage(sample, [
        [/<!doctype\s+html/i, 5],
        [/<html\b/i, 5],
        [/<\/(?:body|div|main|section|script)>/i, 3],
        [/<(?:div|main|section|article|button|form|input)\b[^>]*>/i, 2]
      ]),
      priority: 6
    },
    {
      language: "sql",
      score: scoreLanguage(sample, [
        [/^\s*select\b[\s\S]*\bfrom\b/imu, 5],
        [/^\s*(?:insert\s+into|update|delete\s+from|create\s+table|alter\s+table)\b/imu, 5],
        [/\bwhere\b[\s\S]*=/iu, 2],
        [/\bjoin\b[\s\S]*\bon\b/iu, 2]
      ]),
      priority: 6
    },
    {
      language: "css",
      score: scoreLanguage(sample, [
        [/^\s*@media\b/mu, 5],
        [/^\s*(?:body|html|\.|#|[a-z-]+\s*[,{])[\s\S]*\{[\s\S]*(?:color|display|margin|padding|font-size)\s*:/imu, 4],
        [/\b(?:display|position|margin|padding|font-size|background(?:-color)?)\s*:/iu, 3]
      ]),
      priority: 5
    },
    {
      language: "javascript",
      score: scoreLanguage(sample, [
        [/\bconsole\.(?:log|error|warn|info)\s*\(/u, 3],
        [/^\s*(?:async\s+)?function\s+\w+\s*\(/mu, 4],
        [/^\s*(?:const|let|var)\s+\w+\s*=/mu, 2],
        [/=>/u, 2],
        [/\b(?:require|module\.exports|exports\.)\b/u, 3],
        [/\b(?:document|window)\./u, 2]
      ]),
      priority: 1
    }
  ];

  const bestMatch = candidates
    .filter((candidate) => candidate.score >= 2)
    .sort((left, right) => right.score - left.score || right.priority - left.priority)[0];

  return bestMatch?.language ?? "plaintext";
}

function scoreLanguage(sourceCode: string, rules: Array<[RegExp, number]>): number {
  return rules.reduce((score, [pattern, weight]) => score + (pattern.test(sourceCode) ? weight : 0), 0);
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
