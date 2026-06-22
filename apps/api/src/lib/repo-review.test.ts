import {
  RepoReviewError,
  attachRepoReviewFixArtifacts,
  buildSourceContext,
  createCorrectedZipArtifact,
  parseGitHubRepoUrl,
  prepareZipRepoReview,
  selectReviewCandidates,
  type GitHubTreeEntry,
  type RepoReviewLimits
} from "./repo-review";
import JSZip from "jszip";

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

describe("attachRepoReviewFixArtifacts", () => {
  it("adds downloadable patches and corrected files for exact replacements", () => {
    const report = attachRepoReviewFixArtifacts({
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
            patch: null,
            correctedFile: null
          }
        }
      ],
      nextSteps: []
    }, [
      {
        path: "src/index.ts",
        size: 55,
        score: 10,
        content: "export function check(value: number) {\n  return value == 1;\n}"
      }
    ]);

    expect(report.findings[0]?.fix?.correctedFile).toEqual({
      file: "src/index.ts",
      content: "export function check(value: number) {\n  return value === 1;\n}"
    });
    expect(report.findings[0]?.fix?.patch).toContain("diff --git a/src/index.ts b/src/index.ts");
    expect(report.findings[0]?.fix?.patch).toContain("-  return value == 1;");
    expect(report.findings[0]?.fix?.patch).toContain("+  return value === 1;");
    expect(report.fixes?.patch).toContain("+  return value === 1;");
    expect(report.fixes?.correctedFiles).toHaveLength(1);
  });

  it("skips overlapping fixes in aggregate corrected files", () => {
    const report = attachRepoReviewFixArtifacts({
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
        findingWithFix("src/index.ts", 1, 2, "const safe = true;"),
        findingWithFix("src/index.ts", 2, 2, "const alsoSafe = true;")
      ],
      nextSteps: []
    }, [
      {
        path: "src/index.ts",
        size: 31,
        score: 10,
        content: "const unsafe = false;\nconsole.log(unsafe);"
      }
    ]);

    expect(report.findings[0]?.fix?.correctedFile?.content).toBe("const safe = true;");
    expect(report.findings[1]?.fix?.correctedFile?.content).toBe("const unsafe = false;\nconst alsoSafe = true;");
    expect(report.fixes?.correctedFiles).toEqual([
      {
        file: "src/index.ts",
        content: "const safe = true;"
      }
    ]);
  });
});

describe("prepareZipRepoReview", () => {
  it("prepares supported source files from uploaded zips", async () => {
    const buffer = await buildZipBuffer({
      "project/package.json": JSON.stringify({ dependencies: { react: "latest" } }),
      "project/src/index.ts": "export const ok = true;",
      "project/node_modules/pkg/index.js": "module.exports = true;",
      "project/assets/logo.png": "\u0000png"
    });

    const prepared = await prepareZipRepoReview(buffer, "project.zip", LIMITS);

    expect(prepared.repoName).toBe("project");
    expect(prepared.defaultBranch).toBe("uploaded-zip");
    expect(prepared.sourceFiles.map((file) => file.path).sort()).toEqual([
      "project/package.json",
      "project/src/index.ts"
    ]);
    expect(prepared.languages).toEqual(expect.arrayContaining(["TypeScript", "React"]));
  });

  it("rejects unsafe zip paths", async () => {
    const zip = new JSZip();
    zip.file("../src/index.ts", "export const ok = true;");

    await expect(prepareZipRepoReview(await zip.generateAsync({ type: "nodebuffer" }), "unsafe.zip", LIMITS))
      .rejects.toThrow(RepoReviewError);
  });
});

describe("createCorrectedZipArtifact", () => {
  it("returns a corrected zip with fixed files and an embedded report", async () => {
    const buffer = await buildZipBuffer({
      "src/index.ts": "export const value = 1 == 1;"
    });
    const report = attachRepoReviewFixArtifacts({
      summary: "Review",
      repo: {
        url: "upload://project",
        name: "project",
        defaultBranch: "uploaded-zip"
      },
      stats: {
        filesScanned: 1,
        languages: ["TypeScript"]
      },
      findings: [
        findingWithFix("src/index.ts", 1, 1, "export const value = 1 === 1;")
      ],
      nextSteps: ["Run tests."]
    }, [
      {
        path: "src/index.ts",
        size: 28,
        score: 10,
        content: "export const value = 1 == 1;"
      }
    ]);

    const artifact = await createCorrectedZipArtifact(buffer, report, "project.zip");
    const correctedZip = await JSZip.loadAsync(Buffer.from(artifact.base64, "base64"));

    await expect(correctedZip.file("src/index.ts")?.async("text")).resolves.toBe("export const value = 1 === 1;");
    await expect(correctedZip.file("CODEMENTOR_REVIEW_REPORT.md")?.async("text")).resolves.toContain("Run tests.");
    expect(artifact.filename).toBe("project-codementor-reviewed.zip");
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

function findingWithFix(file: string, lineStart: number, lineEnd: number, replacement: string) {
  return {
    severity: "medium" as const,
    title: "Finding",
    file,
    line: lineStart,
    description: "Description",
    recommendation: "Recommendation",
    fix: {
      lineStart,
      lineEnd,
      replacement,
      patch: null,
      correctedFile: null
    }
  };
}

async function buildZipBuffer(files: Record<string, string>): Promise<Buffer> {
  const zip = new JSZip();
  for (const [filePath, content] of Object.entries(files)) {
    zip.file(filePath, content);
  }

  return zip.generateAsync({ type: "nodebuffer" });
}
