import {
  RepoReviewError,
  buildSourceContext,
  parseGitHubRepoUrl,
  selectReviewCandidates,
  type GitHubTreeEntry,
  type RepoReviewLimits
} from "./repo-review";

const LIMITS: RepoReviewLimits = {
  maxRepoSizeKb: 10_000,
  maxTreeFiles: 100,
  maxFiles: 3,
  maxFileSizeBytes: 20_000,
  maxDownloadBytes: 35_000,
  maxContextChars: 20_000
};

describe("parseGitHubRepoUrl", () => {
  it("accepts canonical GitHub repository URLs", () => {
    expect(parseGitHubRepoUrl("https://github.com/openai/openai-node")).toEqual({
      owner: "openai",
      repo: "openai-node",
      canonicalUrl: "https://github.com/openai/openai-node"
    });
  });

  it("strips .git suffixes", () => {
    expect(parseGitHubRepoUrl("github.com/example/project.git")).toMatchObject({
      owner: "example",
      repo: "project"
    });
  });

  it("rejects non-GitHub URLs", () => {
    expect(() => parseGitHubRepoUrl("https://example.com/openai/openai-node")).toThrow(RepoReviewError);
  });
});

describe("selectReviewCandidates", () => {
  it("filters noisy folders, lockfiles, unsupported extensions, and oversized files", () => {
    const files: GitHubTreeEntry[] = [
      treeFile("src/index.ts", 2000),
      treeFile("node_modules/pkg/index.js", 1000),
      treeFile("pnpm-lock.yaml", 1000),
      treeFile("assets/logo.png", 1000),
      treeFile("src/huge.ts", LIMITS.maxFileSizeBytes + 1)
    ];

    expect(selectReviewCandidates(files, LIMITS).map((file) => file.path)).toEqual(["src/index.ts"]);
  });

  it("respects file count and total download limits", () => {
    const files: GitHubTreeEntry[] = [
      treeFile("src/a.ts", 12_000),
      treeFile("src/b.ts", 12_000),
      treeFile("src/c.ts", 12_000),
      treeFile("src/d.ts", 12_000)
    ];

    const selected = selectReviewCandidates(files, { ...LIMITS, maxFiles: 4, maxDownloadBytes: 25_000 });

    expect(selected).toHaveLength(2);
    expect(selected.reduce((total, file) => total + file.size, 0)).toBeLessThanOrEqual(25_000);
  });
});

describe("buildSourceContext", () => {
  it("preserves file paths and line numbers", () => {
    const context = buildSourceContext([
      {
        path: "src/index.ts",
        size: 30,
        score: 10,
        content: "const a = 1;\nconst b = 2;"
      }
    ], 1000);

    expect(context).toContain("### src/index.ts (lines 1-2)");
    expect(context).toContain("   1 | const a = 1;");
    expect(context).toContain("   2 | const b = 2;");
  });
});

function treeFile(path: string, size: number): GitHubTreeEntry {
  return {
    path,
    size,
    type: "blob",
    url: `https://api.github.com/repos/example/project/git/blobs/${encodeURIComponent(path)}`
  };
}
