import assert from "node:assert/strict";
import type { ReviewIssue, ReviewSeverity } from "@codementor-ai/types";
import { streamReviewWithFailover } from "../fallback.js";
import { parseReviewIssues } from "../parser.js";

type ExpectedIssue = {
  severity: ReviewSeverity;
  category: string;
};

type EvalCase = {
  name: string;
  language: string;
  sourceCode: string;
  expected: ExpectedIssue[];
};

const EVAL_TIMEOUT_MS = Number.parseInt(process.env.AI_EVAL_TIMEOUT_MS ?? "20000", 10);

const GOLDEN_SET: EvalCase[] = [
  {
    name: "style/readability issue",
    language: "typescript",
    sourceCode: `
export function formatUserName(firstName: string, lastName: string) {
  const x = firstName + " " + lastName;
  return x;
}
`,
    expected: [{ severity: "style", category: "readability" }]
  },
  {
    name: "best practice/error handling issue",
    language: "typescript",
    sourceCode: `
export async function loadProfile(userId: string) {
  const response = await fetch("/api/users/" + userId);
  return response.json();
}
`,
    expected: [{ severity: "best_practice", category: "error" }]
  },
  {
    name: "logic/control flow issue",
    language: "typescript",
    sourceCode: `
export function isComplete(status: string) {
  if (status = "complete") {
    return true;
  }
  return false;
}
`,
    expected: [{ severity: "logic", category: "control" }]
  },
  {
    name: "security/secret exposure issue",
    language: "typescript",
    sourceCode: `
export function logAccessToken(token: string) {
  console.log("github token", token);
  return token.slice(0, 4);
}
`,
    expected: [{ severity: "security", category: "security" }]
  },
  {
    name: "multiple issues/security and validation",
    language: "javascript",
    sourceCode: `
app.get("/users", async (req, res) => {
  const query = "SELECT * FROM users WHERE email = '" + req.query.email + "'";
  const users = await db.query(query);
  res.json(users.rows[0].password);
});
`,
    expected: [
      { severity: "security", category: "sql" },
      { severity: "security", category: "sensitive" }
    ]
  }
];

async function main() {
  assert(
    process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY,
    "AI evals make real provider calls. Set GROQ_API_KEY or GEMINI_API_KEY before running."
  );

  for (const evalCase of GOLDEN_SET) {
    const response = await streamReviewWithFailover(
      {
        language: evalCase.language,
        sourceCode: evalCase.sourceCode,
        maxIssues: 5,
        timeoutMs: EVAL_TIMEOUT_MS
      },
      {},
      {
        timeoutMs: EVAL_TIMEOUT_MS
      }
    );

    const parsedIssues = parseReviewIssues(response.rawText);
    const issues = parsedIssues.length > 0 ? parsedIssues : response.issues;

    assert(issues.length > 0, `${evalCase.name}: expected at least one parsed issue.`);

    for (const expected of evalCase.expected) {
      assert(
        hasExpectedIssue(issues, expected),
        `${evalCase.name}: expected ${expected.severity}/${expected.category} in ${summarizeIssues(issues)}`
      );
    }

    console.log(`pass: ${evalCase.name}`);
  }
}

function hasExpectedIssue(issues: ReviewIssue[], expected: ExpectedIssue): boolean {
  const expectedCategory = expected.category.toLowerCase();

  return issues.some((issue) => {
    const category = issue.category.toLowerCase();
    const title = issue.title.toLowerCase();
    const explanation = issue.explanation.toLowerCase();

    return (
      issue.severity === expected.severity &&
      (category.includes(expectedCategory) ||
        title.includes(expectedCategory) ||
        explanation.includes(expectedCategory))
    );
  });
}

function summarizeIssues(issues: ReviewIssue[]): string {
  return JSON.stringify(
    issues.map((issue) => ({
      severity: issue.severity,
      category: issue.category,
      title: issue.title
    })),
    null,
    2
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
