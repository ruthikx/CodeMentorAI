import { ReviewIssueStreamParser, parseReviewIssues, validateReviewIssue } from "./parser";

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

describe("validateReviewIssue", () => {
  it("normalizes common severity aliases from model output", () => {
    expect(validateReviewIssue({ ...VALID_ISSUE, severity: "medium" })).toMatchObject({
      severity: "logic"
    });
  });

  it("rejects inverted line ranges", () => {
    expect(() => validateReviewIssue({ ...VALID_ISSUE, lineStart: 8, lineEnd: 2 })).toThrow(
      "lineEnd must be greater than or equal to lineStart"
    );
  });
});
