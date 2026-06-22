import { ReviewIssueStreamParser, parseRepoReviewReport, parseReviewIssues, validateReviewIssue } from "./parser";

const VALID_ISSUE = {
  severity: "logic",
  category: "Control Flow",
  lineStart: 4,
  lineEnd: 6,
  title: "Assignment inside condition",
  explanation: "The condition assigns a value instead of comparing it.",
  suggestedFix: "if (status === 'complete') return true;"
};

describe("parseReviewIssues", () => {
  it("parses fenced JSON arrays and attaches review metadata", () => {
    const issues = parseReviewIssues(`\`\`\`json\n[${JSON.stringify(VALID_ISSUE)}]\n\`\`\``, {
      reviewId: "review-1"
    });

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      ...VALID_ISSUE,
      reviewId: "review-1",
      accepted: false
    });
    expect(issues[0].id).toEqual(expect.any(String));
  });

  it("returns an empty array for invalid AI output", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    expect(parseReviewIssues("not json")).toEqual([]);

    consoleSpy.mockRestore();
  });
});

describe("ReviewIssueStreamParser", () => {
  it("emits complete issue objects from chunked array content", () => {
    const parser = new ReviewIssueStreamParser();
    const first = parser.push(`[${JSON.stringify(VALID_ISSUE).slice(0, 30)}`);
    const second = parser.push(`${JSON.stringify(VALID_ISSUE).slice(30)}]`, { reviewId: "stream-review" });

    expect(first).toEqual([]);
    expect(second).toHaveLength(1);
    expect(second[0]).toMatchObject({
      category: "Control Flow",
      reviewId: "stream-review"
    });
  });
});

describe("parseRepoReviewReport", () => {
  it("parses exact replacement fix payloads without trimming indentation", () => {
    const report = parseRepoReviewReport(JSON.stringify({
      summary: "Review",
      repo: {
        url: "https://github.com/example/project",
        name: "example/project",
        defaultBranch: "main"
      },
      stats: {
        filesScanned: 1,
        languages: ["TypeScript"]
      },
      findings: [
        {
          severity: "medium",
          title: "Use strict equality",
          file: "src/index.ts",
          line: 2,
          description: "Loose equality can coerce values.",
          recommendation: "Use strict equality.",
          fix: {
            lineStart: 2,
            lineEnd: 2,
            replacement: "  return value === 1;",
            patch: null
          }
        }
      ],
      nextSteps: []
    }), {
      repoUrl: "https://github.com/example/project",
      repoName: "example/project",
      defaultBranch: "main",
      filesScanned: 1,
      languages: ["TypeScript"]
    });

    expect(report.findings[0]?.fix).toMatchObject({
      lineStart: 2,
      lineEnd: 2,
      replacement: "  return value === 1;",
      patch: null,
      correctedFile: null
    });
  });

  it("accepts common model fix aliases for repo review findings", () => {
    const report = parseRepoReviewReport(JSON.stringify({
      summary: "Review",
      repo: {
        url: "https://github.com/example/project",
        name: "example/project",
        defaultBranch: "main"
      },
      stats: {
        filesScanned: 1,
        languages: ["Python"]
      },
      findings: [
        {
          severity: "critical",
          title: "Hardcoded password",
          file: "main.py",
          line: "3",
          description: "The password is hardcoded.",
          recommendation: "Read the password from an environment variable.",
          suggestedFix: "password = os.environ[\"APP_PASSWORD\"]"
        }
      ],
      nextSteps: []
    }), {
      repoUrl: "https://github.com/example/project",
      repoName: "example/project",
      defaultBranch: "main",
      filesScanned: 1,
      languages: ["Python"]
    });

    expect(report.findings[0]?.line).toBe(3);
    expect(report.findings[0]?.fix).toMatchObject({
      lineStart: 3,
      lineEnd: 3,
      replacement: "password = os.environ[\"APP_PASSWORD\"]"
    });
  });
});

describe("validateReviewIssue", () => {
  it("normalizes common severity aliases from model output", () => {
    expect(validateReviewIssue({ ...VALID_ISSUE, severity: "medium" })).toMatchObject({
      severity: "logic"
    });
  });

  it("removes prose prefixes from suggested fixes", () => {
    expect(
      validateReviewIssue({
        ...VALID_ISSUE,
        suggestedFix: "Consider replacing the duplicated code with a loop, for example: for _ in range(8): print('hello')"
      })
    ).toMatchObject({
      suggestedFix: "for _ in range(8): print('hello')"
    });
  });

  it("rejects inverted line ranges", () => {
    expect(() => validateReviewIssue({ ...VALID_ISSUE, lineStart: 8, lineEnd: 2 })).toThrow(
      "lineEnd must be greater than or equal to lineStart"
    );
  });
});
