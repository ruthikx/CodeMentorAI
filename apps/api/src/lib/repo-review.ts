import JSZip from "jszip";
import type { RepoReviewCorrectedFile, RepoReviewFinding, RepoReviewReport } from "@codementor-ai/types";

export interface ParsedGitHubRepoUrl {
  owner: string;
  repo: string;
  canonicalUrl: string;
}

export interface RepoReviewLimits {
  maxRepoSizeKb: number;
  maxTreeFiles: number;
  maxFiles: number;
  maxFileSizeBytes: number;
  maxDownloadBytes: number;
  maxContextChars: number;
}

export interface GitHubTreeEntry {
  path: string;
  type: string;
  size?: number;
  url?: string;
}

export interface RepoReviewSourceFile {
  path: string;
  size: number;
  content: string;
  score: number;
}

export interface PreparedRepoReview {
  repoUrl: string;
  repoName: string;
  defaultBranch: string;
  fileTree: string;
  languages: string[];
  filesScanned: number;
  sourceContext: string;
  sourceFiles: RepoReviewSourceFile[];
}

export interface ZipRepoReviewArtifact {
  filename: string;
  mimeType: "application/zip";
  base64: string;
}

interface GitHubRepoResponse {
  full_name?: string;
  name?: string;
  default_branch?: string;
  private?: boolean;
  size?: number;
  html_url?: string;
}

interface GitHubTreeResponse {
  tree?: GitHubTreeEntry[];
  truncated?: boolean;
}

interface GitHubBlobResponse {
  content?: string;
  encoding?: string;
  size?: number;
}

interface ReviewCandidate {
  path: string;
  size: number;
  url: string;
  score: number;
}

interface LocalReviewCandidate {
  path: string;
  size: number;
  score: number;
  entry: JSZip.JSZipObject;
}

const DEFAULT_LIMITS: RepoReviewLimits = {
  maxRepoSizeKb: 25_000,
  maxTreeFiles: 2_000,
  maxFiles: 60,
  maxFileSizeBytes: 120 * 1024,
  maxDownloadBytes: 750 * 1024,
  maxContextChars: 70_000
};

const IGNORED_PATH_SEGMENTS = new Set([
  ".git",
  ".hg",
  ".svn",
  ".next",
  ".nuxt",
  ".cache",
  ".turbo",
  "node_modules",
  "dist",
  "build",
  "coverage",
  "vendor",
  "target",
  "bin",
  "obj",
  "__pycache__",
  ".pytest_cache",
  ".mypy_cache",
  ".venv",
  "venv"
]);

const IGNORED_FILE_NAMES = new Set([
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lockb",
  "composer.lock",
  "poetry.lock",
  "pdm.lock",
  "cargo.lock",
  "gemfile.lock",
  "go.sum",
  "npm-shrinkwrap.json"
]);

const SUPPORTED_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".py",
  ".java",
  ".go",
  ".rs",
  ".c",
  ".h",
  ".cc",
  ".cpp",
  ".cxx",
  ".hpp",
  ".cs",
  ".php",
  ".rb",
  ".swift",
  ".kt",
  ".kts",
  ".scala",
  ".dart",
  ".sql",
  ".html",
  ".css",
  ".scss",
  ".sass",
  ".vue",
  ".svelte",
  ".json",
  ".yaml",
  ".yml",
  ".toml",
  ".xml",
  ".graphql",
  ".gql",
  ".proto",
  ".prisma",
  ".sh",
  ".bash",
  ".zsh",
  ".ps1",
  ".md"
]);

const SUPPORTED_FILE_NAMES = new Set([
  "dockerfile",
  "makefile",
  "cmakelists.txt",
  "package.json",
  "tsconfig.json",
  "jsconfig.json",
  "next.config.js",
  "next.config.mjs",
  "vite.config.js",
  "vite.config.ts",
  "webpack.config.js",
  "tailwind.config.js",
  "tailwind.config.ts",
  "docker-compose.yml",
  "docker-compose.yaml",
  "compose.yml",
  "compose.yaml",
  "requirements.txt",
  "pyproject.toml",
  "pom.xml",
  "build.gradle",
  "settings.gradle",
  "go.mod",
  "cargo.toml",
  "gemfile"
]);

const LANGUAGE_BY_EXTENSION = new Map([
  [".ts", "TypeScript"],
  [".tsx", "TypeScript"],
  [".js", "JavaScript"],
  [".jsx", "JavaScript"],
  [".mjs", "JavaScript"],
  [".cjs", "JavaScript"],
  [".py", "Python"],
  [".java", "Java"],
  [".go", "Go"],
  [".rs", "Rust"],
  [".c", "C"],
  [".h", "C/C++"],
  [".cc", "C++"],
  [".cpp", "C++"],
  [".cxx", "C++"],
  [".hpp", "C++"],
  [".cs", "C#"],
  [".php", "PHP"],
  [".rb", "Ruby"],
  [".swift", "Swift"],
  [".kt", "Kotlin"],
  [".kts", "Kotlin"],
  [".scala", "Scala"],
  [".dart", "Dart"],
  [".sql", "SQL"],
  [".html", "HTML"],
  [".css", "CSS"],
  [".scss", "CSS"],
  [".sass", "CSS"],
  [".vue", "Vue"],
  [".svelte", "Svelte"],
  [".prisma", "Prisma"],
  [".sh", "Shell"],
  [".bash", "Shell"],
  [".zsh", "Shell"],
  [".ps1", "PowerShell"]
]);

const MAX_TREE_SUMMARY_LINES = 220;
const MAX_CHUNK_CHARS = 6_000;

export class RepoReviewError extends Error {
  constructor(message: string, public readonly statusCode = 400) {
    super(message);
    this.name = "RepoReviewError";
  }
}

export function attachRepoReviewFixArtifacts(
  report: RepoReviewReport,
  sourceFiles: RepoReviewSourceFile[]
): RepoReviewReport {
  const sourceByPath = new Map(sourceFiles.map((file) => [file.path, file]));
  const aggregateFixes = new Map<string, ValidRepoReviewReplacement[]>();
  const correctedByPath = new Map<string, RepoReviewCorrectedFile>();
  const findings = report.findings.map((finding) => {
    const enriched = attachFindingFixArtifact(finding, sourceByPath);

    if (enriched.fix?.correctedFile) {
      const fixes = aggregateFixes.get(enriched.file) ?? [];
      fixes.push({
        lineStart: enriched.fix.lineStart,
        lineEnd: enriched.fix.lineEnd,
        replacement: enriched.fix.replacement
      });
      aggregateFixes.set(enriched.file, fixes);
    }

    return enriched;
  });

  const aggregatePatches: string[] = [];
  for (const [filePath, fixes] of [...aggregateFixes.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const sourceFile = sourceByPath.get(filePath);
    if (!sourceFile) {
      continue;
    }

    const applicableFixes = selectNonOverlappingFixes(fixes, countLines(sourceFile.content));
    if (applicableFixes.length === 0) {
      continue;
    }

    const correctedContent = applyLineReplacements(sourceFile.content, applicableFixes);
    correctedByPath.set(filePath, {
      file: filePath,
      content: correctedContent
    });
    aggregatePatches.push(buildUnifiedPatch(filePath, sourceFile.content, applicableFixes));
  }

  return {
    ...report,
    findings,
    fixes: {
      patch: aggregatePatches.length > 0 ? aggregatePatches.join("\n") : null,
      correctedFiles: [...correctedByPath.values()].sort((left, right) => left.file.localeCompare(right.file))
    }
  };
}

export async function createCorrectedZipArtifact(
  inputZipBuffer: Buffer,
  report: RepoReviewReport,
  originalFilename: string
): Promise<ZipRepoReviewArtifact> {
  const zip = await loadZip(inputZipBuffer);

  for (const file of report.fixes?.correctedFiles ?? []) {
    if (!isSafeZipPath(file.file)) {
      continue;
    }

    const existing = zip.file(file.file);
    const date = existing?.date;
    zip.file(file.file, file.content, {
      date,
      createFolders: true
    });
  }

  zip.file("CODEMENTOR_REVIEW_REPORT.md", buildRepoReviewMarkdown(report), {
    createFolders: true
  });

  const correctedZipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: {
      level: 6
    }
  });

  return {
    filename: buildCorrectedZipFilename(originalFilename),
    mimeType: "application/zip",
    base64: correctedZipBuffer.toString("base64")
  };
}

interface ValidRepoReviewReplacement {
  lineStart: number;
  lineEnd: number;
  replacement: string;
}

function attachFindingFixArtifact(
  finding: RepoReviewFinding,
  sourceByPath: Map<string, RepoReviewSourceFile>
): RepoReviewFinding {
  if (!finding.fix) {
    return finding;
  }

  const sourceFile = sourceByPath.get(finding.file);
  if (!sourceFile) {
    return { ...finding, fix: null };
  }

  const replacement = normalizeReplacementCode(finding.fix.replacement);
  const replacementFix = {
    lineStart: finding.fix.lineStart,
    lineEnd: finding.fix.lineEnd,
    replacement
  };
  if (!isApplicableReplacement(replacementFix, countLines(sourceFile.content))) {
    return { ...finding, fix: null };
  }

  const correctedContent = applyLineReplacements(sourceFile.content, [replacementFix]);
  const patch = buildUnifiedPatch(finding.file, sourceFile.content, [replacementFix]);

  return {
    ...finding,
    fix: {
      ...finding.fix,
      replacement,
      patch,
      correctedFile: {
        file: finding.file,
        content: correctedContent
      }
    }
  };
}

function selectNonOverlappingFixes(
  fixes: ValidRepoReviewReplacement[],
  lineCount: number
): ValidRepoReviewReplacement[] {
  const selected: ValidRepoReviewReplacement[] = [];
  let lastLineEnd = 0;

  for (const fix of fixes.sort((left, right) => left.lineStart - right.lineStart || left.lineEnd - right.lineEnd)) {
    if (!isApplicableReplacement(fix, lineCount) || fix.lineStart <= lastLineEnd) {
      continue;
    }

    selected.push(fix);
    lastLineEnd = fix.lineEnd;
  }

  return selected;
}

function isApplicableReplacement(fix: ValidRepoReviewReplacement, lineCount: number): boolean {
  return fix.lineStart >= 1 && fix.lineEnd >= fix.lineStart && fix.lineEnd <= lineCount;
}

function applyLineReplacements(
  content: string,
  fixes: ValidRepoReviewReplacement[]
): string {
  const eol = detectLineEnding(content);
  const lines = normalizeLineEndings(content).split("\n");

  for (const fix of [...fixes].sort((left, right) => right.lineStart - left.lineStart || right.lineEnd - left.lineEnd)) {
    const replacementLines = fix.replacement.length > 0 ? fix.replacement.split("\n") : [];
    lines.splice(fix.lineStart - 1, fix.lineEnd - fix.lineStart + 1, ...replacementLines);
  }

  return lines.join(eol);
}

function buildUnifiedPatch(
  filePath: string,
  originalContent: string,
  fixes: ValidRepoReviewReplacement[]
): string {
  const originalLines = normalizeLineEndings(originalContent).split("\n");
  const applicableFixes = selectNonOverlappingFixes(fixes, originalLines.length);
  const hunks = buildPatchHunks(originalLines, applicableFixes);

  return [
    `diff --git a/${filePath} b/${filePath}`,
    `--- a/${filePath}`,
    `+++ b/${filePath}`,
    ...hunks
  ].join("\n");
}

function buildPatchHunks(
  originalLines: string[],
  fixes: ValidRepoReviewReplacement[]
): string[] {
  const contextLines = 3;
  const windows = fixes.map((fix) => ({
    start: Math.max(0, fix.lineStart - 1 - contextLines),
    end: Math.min(originalLines.length, fix.lineEnd + contextLines),
    fixes: [fix]
  }));
  const mergedWindows: Array<{ start: number; end: number; fixes: ValidRepoReviewReplacement[] }> = [];

  for (const window of windows) {
    const previous = mergedWindows[mergedWindows.length - 1];
    if (previous && window.start <= previous.end) {
      previous.end = Math.max(previous.end, window.end);
      previous.fixes.push(...window.fixes);
      continue;
    }

    mergedWindows.push(window);
  }

  let cumulativeDelta = 0;
  const hunks: string[] = [];
  for (const window of mergedWindows) {
    const deltaBeforeWindow = cumulativeDelta;
    const oldStart = window.start + 1;
    const oldCount = window.end - window.start;
    const newStart = window.start + 1 + deltaBeforeWindow;
    let newCount = oldCount;
    const body: string[] = [];
    let cursor = window.start;

    for (const fix of window.fixes) {
      const fixStartIndex = fix.lineStart - 1;
      const fixEndIndex = fix.lineEnd;
      const replacementLines = fix.replacement.length > 0 ? fix.replacement.split("\n") : [];

      for (const line of originalLines.slice(cursor, fixStartIndex)) {
        body.push(` ${line}`);
      }

      for (const line of originalLines.slice(fixStartIndex, fixEndIndex)) {
        body.push(`-${line}`);
      }

      for (const line of replacementLines) {
        body.push(`+${line}`);
      }

      const delta = replacementLines.length - (fixEndIndex - fixStartIndex);
      newCount += delta;
      cumulativeDelta += delta;
      cursor = fixEndIndex;
    }

    for (const line of originalLines.slice(cursor, window.end)) {
      body.push(` ${line}`);
    }

    hunks.push(`@@ -${oldStart},${oldCount} +${newStart},${newCount} @@`, ...body);
  }

  return hunks;
}

function countLines(content: string): number {
  return normalizeLineEndings(content).split("\n").length;
}

function normalizeReplacementCode(value: string): string {
  return stripCodeFencePreservingIndent(value.replace(/\r\n/g, "\n"));
}

function stripCodeFencePreservingIndent(value: string): string {
  const withoutBoundaryBlankLines = trimBoundaryBlankLines(value);
  const fenceMatch = withoutBoundaryBlankLines.match(/^```[a-zA-Z0-9_-]*[ \t]*\n?([\s\S]*?)\n?```$/u);

  if (fenceMatch) {
    return trimBoundaryBlankLines(fenceMatch[1]);
  }

  return withoutBoundaryBlankLines;
}

function trimBoundaryBlankLines(value: string): string {
  return value.replace(/^\n+/u, "").replace(/\n+$/u, "");
}

function normalizeLineEndings(content: string): string {
  return content.replace(/\r\n/g, "\n");
}

function detectLineEnding(content: string): "\r\n" | "\n" {
  return content.includes("\r\n") ? "\r\n" : "\n";
}

export async function preparePublicRepoReview(
  inputUrl: string,
  limits: RepoReviewLimits = getRepoReviewLimits()
): Promise<PreparedRepoReview> {
  const parsed = parseGitHubRepoUrl(inputUrl);
  const repo = await fetchGitHubJson<GitHubRepoResponse>(
    `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`
  );

  if (repo.private) {
    throw new RepoReviewError("Private repositories are not supported yet. Submit a public GitHub repository URL.", 400);
  }

  const repoSizeKb = typeof repo.size === "number" ? repo.size : 0;
  if (repoSizeKb > limits.maxRepoSizeKb) {
    throw new RepoReviewError(
      `Repository is too large to review right now (${formatBytes(repoSizeKb * 1024)}). The current limit is ${formatBytes(limits.maxRepoSizeKb * 1024)}.`,
      413
    );
  }

  const defaultBranch = repo.default_branch?.trim() || "main";
  const tree = await fetchGitHubJson<GitHubTreeResponse>(
    `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}/git/trees/${encodeURIComponent(defaultBranch)}?recursive=1`
  );

  if (tree.truncated) {
    throw new RepoReviewError(
      "GitHub returned a truncated repository tree. The repository is too large for this first version of repo review.",
      413
    );
  }

  const allFiles = (tree.tree ?? []).filter((entry) => entry.type === "blob");
  if (allFiles.length > limits.maxTreeFiles) {
    throw new RepoReviewError(
      `Repository has ${allFiles.length} files, which exceeds the current ${limits.maxTreeFiles} file limit.`,
      413
    );
  }

  const candidates = selectReviewCandidates(allFiles, limits);
  if (candidates.length === 0) {
    throw new RepoReviewError(
      "No supported source files were found after applying file type, size, and noise-folder filters.",
      400
    );
  }

  const sourceFiles = await fetchSourceFiles(candidates, limits);
  if (sourceFiles.length === 0) {
    throw new RepoReviewError("Supported files were found, but none could be fetched as UTF-8 text.", 422);
  }

  const languages = detectLanguagesAndFrameworks(sourceFiles, allFiles);

  return {
    repoUrl: repo.html_url ?? parsed.canonicalUrl,
    repoName: repo.full_name ?? `${parsed.owner}/${parsed.repo}`,
    defaultBranch,
    fileTree: buildFileTreeSummary(allFiles, new Set(sourceFiles.map((file) => file.path))),
    languages,
    filesScanned: sourceFiles.length,
    sourceContext: buildSourceContext(sourceFiles, limits.maxContextChars),
    sourceFiles
  };
}

export async function prepareZipRepoReview(
  inputZipBuffer: Buffer,
  originalFilename: string,
  limits: RepoReviewLimits = getRepoReviewLimits()
): Promise<PreparedRepoReview> {
  if (inputZipBuffer.length > limits.maxRepoSizeKb * 1024) {
    throw new RepoReviewError(
      `Uploaded zip is too large to review right now (${formatBytes(inputZipBuffer.length)}). The current limit is ${formatBytes(limits.maxRepoSizeKb * 1024)}.`,
      413
    );
  }

  const zip = await loadZip(inputZipBuffer);
  const allFiles: GitHubTreeEntry[] = [];
  const localFiles = new Map<string, LocalReviewCandidate>();

  for (const entry of Object.values(zip.files)) {
    if (entry.dir) {
      continue;
    }

    const normalizedPath = normalizeZipPath(entry.name);
    const originalPath = entry.unsafeOriginalName ?? entry.name;
    if (!normalizedPath || !isSafeZipPath(entry.name) || !isSafeZipPath(originalPath)) {
      throw new RepoReviewError("Uploaded zip contains an unsafe file path.", 400);
    }

    if (localFiles.has(normalizedPath)) {
      continue;
    }

    const size = getZipEntryUncompressedSize(entry);
    allFiles.push({
      path: normalizedPath,
      type: "blob",
      size
    });
    localFiles.set(normalizedPath, {
      path: normalizedPath,
      size,
      score: scoreReviewPath(normalizedPath, size),
      entry
    });
  }

  if (allFiles.length === 0) {
    throw new RepoReviewError("Uploaded zip did not contain any files.", 400);
  }

  if (allFiles.length > limits.maxTreeFiles) {
    throw new RepoReviewError(
      `Uploaded zip has ${allFiles.length} files, which exceeds the current ${limits.maxTreeFiles} file limit.`,
      413
    );
  }

  const candidates = selectLocalReviewCandidates([...localFiles.values()], limits);
  if (candidates.length === 0) {
    throw new RepoReviewError(
      "No supported source files were found after applying file type, size, and noise-folder filters.",
      400
    );
  }

  const sourceFiles = await readLocalSourceFiles(candidates, limits);
  if (sourceFiles.length === 0) {
    throw new RepoReviewError("Supported files were found, but none could be read as UTF-8 text.", 422);
  }

  const languages = detectLanguagesAndFrameworks(sourceFiles, allFiles);
  const repoName = buildRepoNameFromZipFilename(originalFilename);

  return {
    repoUrl: `upload://${repoName}`,
    repoName,
    defaultBranch: "uploaded-zip",
    fileTree: buildFileTreeSummary(allFiles, new Set(sourceFiles.map((file) => file.path))),
    languages,
    filesScanned: sourceFiles.length,
    sourceContext: buildSourceContext(sourceFiles, limits.maxContextChars),
    sourceFiles
  };
}

export function parseGitHubRepoUrl(input: string): ParsedGitHubRepoUrl {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    throw new RepoReviewError("GitHub repository URL is required.", 400);
  }

  let parsed: URL;
  try {
    parsed = new URL(/^[a-z][a-z0-9+.-]*:\/\//iu.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    throw new RepoReviewError("Enter a valid GitHub repository URL.", 400);
  }

  const host = parsed.hostname.toLowerCase();
  if (host !== "github.com" && host !== "www.github.com") {
    throw new RepoReviewError("Only github.com repository URLs are supported.", 400);
  }

  const segments = parsed.pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment));

  if (segments.length < 2) {
    throw new RepoReviewError("GitHub repository URL must include both owner and repository name.", 400);
  }

  const owner = segments[0];
  const repo = segments[1].replace(/\.git$/iu, "");

  if (!isValidGitHubOwner(owner) || !isValidGitHubRepo(repo)) {
    throw new RepoReviewError("GitHub repository URL contains an invalid owner or repository name.", 400);
  }

  return {
    owner,
    repo,
    canonicalUrl: `https://github.com/${owner}/${repo}`
  };
}

export function getRepoReviewLimits(): RepoReviewLimits {
  return {
    maxRepoSizeKb: readPositiveIntEnv("REPO_REVIEW_MAX_REPO_SIZE_KB", DEFAULT_LIMITS.maxRepoSizeKb),
    maxTreeFiles: readPositiveIntEnv("REPO_REVIEW_MAX_TREE_FILES", DEFAULT_LIMITS.maxTreeFiles),
    maxFiles: readPositiveIntEnv("REPO_REVIEW_MAX_FILES", DEFAULT_LIMITS.maxFiles),
    maxFileSizeBytes: readPositiveIntEnv("REPO_REVIEW_MAX_FILE_SIZE_BYTES", DEFAULT_LIMITS.maxFileSizeBytes),
    maxDownloadBytes: readPositiveIntEnv("REPO_REVIEW_MAX_DOWNLOAD_BYTES", DEFAULT_LIMITS.maxDownloadBytes),
    maxContextChars: readPositiveIntEnv("REPO_REVIEW_MAX_CONTEXT_CHARS", DEFAULT_LIMITS.maxContextChars)
  };
}

export function selectReviewCandidates(
  files: GitHubTreeEntry[],
  limits: RepoReviewLimits
): ReviewCandidate[] {
  const eligible = files
    .filter((entry) => entry.type === "blob")
    .map((entry) => {
      const size = typeof entry.size === "number" ? entry.size : 0;
      const url = typeof entry.url === "string" ? entry.url : "";

      if (
        size <= 0 ||
        size > limits.maxFileSizeBytes ||
        url.length === 0 ||
        isIgnoredPath(entry.path) ||
        !isSupportedTextFile(entry.path)
      ) {
        return null;
      }

      return {
        path: entry.path,
        size,
        url,
        score: scoreReviewPath(entry.path, size)
      } satisfies ReviewCandidate;
    })
    .filter((candidate): candidate is ReviewCandidate => candidate !== null)
    .sort((left, right) => right.score - left.score || left.size - right.size || left.path.localeCompare(right.path));

  const selected: ReviewCandidate[] = [];
  let totalBytes = 0;

  for (const candidate of eligible) {
    if (selected.length >= limits.maxFiles) {
      break;
    }

    if (totalBytes + candidate.size > limits.maxDownloadBytes) {
      continue;
    }

    selected.push(candidate);
    totalBytes += candidate.size;
  }

  return selected;
}

export function buildSourceContext(files: RepoReviewSourceFile[], maxContextChars: number): string {
  const sections: string[] = [];
  let usedChars = 0;

  for (const file of files.sort((left, right) => right.score - left.score || left.path.localeCompare(right.path))) {
    const chunks = chunkNumberedFile(file);

    for (const chunk of chunks) {
      const section = [
        `### ${file.path} (lines ${chunk.lineStart}-${chunk.lineEnd})`,
        "```text",
        chunk.text,
        "```"
      ].join("\n");

      if (usedChars + section.length > maxContextChars) {
        return sections.join("\n\n");
      }

      sections.push(section);
      usedChars += section.length;
    }
  }

  return sections.join("\n\n");
}

async function fetchSourceFiles(
  candidates: ReviewCandidate[],
  limits: RepoReviewLimits
): Promise<RepoReviewSourceFile[]> {
  const files: RepoReviewSourceFile[] = [];
  let downloadedBytes = 0;

  for (const candidate of candidates) {
    if (!candidate.url.startsWith("https://api.github.com/")) {
      continue;
    }

    const blob = await fetchGitHubJson<GitHubBlobResponse>(candidate.url);
    if (blob.encoding !== "base64" || typeof blob.content !== "string") {
      continue;
    }

    const buffer = Buffer.from(blob.content.replace(/\s/g, ""), "base64");
    if (buffer.length > limits.maxFileSizeBytes || downloadedBytes + buffer.length > limits.maxDownloadBytes) {
      continue;
    }

    const content = buffer.toString("utf8");
    if (content.includes("\u0000") || content.trim().length === 0) {
      continue;
    }

    downloadedBytes += buffer.length;
    files.push({
      path: candidate.path,
      size: buffer.length,
      content,
      score: candidate.score
    });
  }

  return files;
}

function selectLocalReviewCandidates(
  files: LocalReviewCandidate[],
  limits: RepoReviewLimits
): LocalReviewCandidate[] {
  const eligible = files
    .filter((entry) =>
      entry.size > 0 &&
      entry.size <= limits.maxFileSizeBytes &&
      !isIgnoredPath(entry.path) &&
      isSupportedTextFile(entry.path)
    )
    .sort((left, right) => right.score - left.score || left.size - right.size || left.path.localeCompare(right.path));

  const selected: LocalReviewCandidate[] = [];
  let totalBytes = 0;

  for (const candidate of eligible) {
    if (selected.length >= limits.maxFiles) {
      break;
    }

    if (totalBytes + candidate.size > limits.maxDownloadBytes) {
      continue;
    }

    selected.push(candidate);
    totalBytes += candidate.size;
  }

  return selected;
}

async function readLocalSourceFiles(
  candidates: LocalReviewCandidate[],
  limits: RepoReviewLimits
): Promise<RepoReviewSourceFile[]> {
  const files: RepoReviewSourceFile[] = [];
  let downloadedBytes = 0;

  for (const candidate of candidates) {
    const buffer = await candidate.entry.async("nodebuffer");
    if (buffer.length > limits.maxFileSizeBytes || downloadedBytes + buffer.length > limits.maxDownloadBytes) {
      continue;
    }

    const content = buffer.toString("utf8");
    if (content.includes("\u0000") || content.trim().length === 0) {
      continue;
    }

    downloadedBytes += buffer.length;
    files.push({
      path: candidate.path,
      size: buffer.length,
      content,
      score: candidate.score
    });
  }

  return files;
}

async function loadZip(inputZipBuffer: Buffer): Promise<JSZip> {
  try {
    return await JSZip.loadAsync(inputZipBuffer);
  } catch {
    throw new RepoReviewError("Uploaded file must be a valid .zip archive.", 400);
  }
}

async function fetchGitHubJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: buildGitHubHeaders()
  });

  const payload = (await response.json().catch(() => ({}))) as { message?: string };

  if (!response.ok) {
    if (response.status === 404) {
      throw new RepoReviewError("Repository was not found or is not public.", 404);
    }

    if (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0") {
      throw new RepoReviewError(
        "GitHub API rate limit reached. Configure GITHUB_ACCESS_TOKEN on the API service or try again later.",
        429
      );
    }

    throw new RepoReviewError(
      payload.message
        ? `GitHub API request failed: ${payload.message}`
        : `GitHub API request failed with status ${response.status}.`,
      response.status >= 500 ? 502 : response.status
    );
  }

  return payload as T;
}

function buildGitHubHeaders(): HeadersInit {
  const token = process.env.GITHUB_ACCESS_TOKEN?.trim();

  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "CodeMentorAI Repo Review",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

function buildFileTreeSummary(files: GitHubTreeEntry[], scannedPaths: Set<string>): string {
  const relevantFiles = files
    .filter((file) => file.type === "blob" && !isIgnoredPath(file.path) && isSupportedTextFile(file.path))
    .sort((left, right) => left.path.localeCompare(right.path));

  const lines = relevantFiles.slice(0, MAX_TREE_SUMMARY_LINES).map((file) => {
    const prefix = scannedPaths.has(file.path) ? "*" : "-";
    const size = typeof file.size === "number" ? ` (${formatBytes(file.size)})` : "";
    return `${prefix} ${file.path}${size}`;
  });

  const omitted = relevantFiles.length - lines.length;
  if (omitted > 0) {
    lines.push(`... ${omitted} more supported files omitted from the tree summary.`);
  }

  return [
    "Files marked with * were included in the source excerpts.",
    ...lines
  ].join("\n");
}

function detectLanguagesAndFrameworks(sourceFiles: RepoReviewSourceFile[], treeFiles: GitHubTreeEntry[]): string[] {
  const counts = new Map<string, number>();
  const allPaths = treeFiles.map((file) => file.path.toLowerCase());
  const sourceByPath = new Map(sourceFiles.map((file) => [file.path.toLowerCase(), file.content]));

  for (const file of sourceFiles) {
    const language = LANGUAGE_BY_EXTENSION.get(getLowerExtension(file.path)) ?? languageFromFileName(file.path);
    if (language) {
      counts.set(language, (counts.get(language) ?? 0) + 1);
    }
  }

  const languages = [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([language]) => language);

  const frameworks = new Set<string>();
  const packageJson = findSourceFileByName(sourceByPath, "package.json");
  if (packageJson) {
    if (/"next"\s*:/u.test(packageJson)) frameworks.add("Next.js");
    if (/"react"\s*:/u.test(packageJson)) frameworks.add("React");
    if (/"vue"\s*:/u.test(packageJson)) frameworks.add("Vue");
    if (/"svelte"\s*:/u.test(packageJson)) frameworks.add("Svelte");
    if (/"express"\s*:/u.test(packageJson)) frameworks.add("Express");
    if (/"@nestjs\/core"\s*:/u.test(packageJson)) frameworks.add("NestJS");
    if (/"vite"\s*:/u.test(packageJson)) frameworks.add("Vite");
    if (/"jest"\s*:/u.test(packageJson)) frameworks.add("Jest");
    if (/"vitest"\s*:/u.test(packageJson)) frameworks.add("Vitest");
  }

  const pyprojectToml = findSourceFileByName(sourceByPath, "pyproject.toml");
  const requirementsTxt = findSourceFileByName(sourceByPath, "requirements.txt");
  if (allPaths.some((path) => getLowerFileName(path) === "pyproject.toml" || getLowerFileName(path) === "requirements.txt")) {
    const pythonManifest = pyprojectToml ?? requirementsTxt ?? "";
    if (/django/iu.test(pythonManifest)) frameworks.add("Django");
    if (/flask/iu.test(pythonManifest)) frameworks.add("Flask");
    if (/fastapi/iu.test(pythonManifest)) frameworks.add("FastAPI");
    if (/pytest/iu.test(pythonManifest)) frameworks.add("pytest");
  }

  if (allPaths.some((path) => getLowerFileName(path) === "go.mod")) frameworks.add("Go modules");
  if (allPaths.some((path) => getLowerFileName(path) === "cargo.toml")) frameworks.add("Cargo");
  if (allPaths.some((path) => getLowerFileName(path) === "pom.xml" || getLowerFileName(path) === "build.gradle")) frameworks.add("JVM build");
  if (allPaths.some((path) => path.endsWith(".prisma"))) frameworks.add("Prisma");

  return Array.from(new Set([...languages, ...frameworks])).slice(0, 12);
}

function findSourceFileByName(sourceByPath: Map<string, string>, fileName: string): string | undefined {
  const directMatch = sourceByPath.get(fileName);
  if (directMatch) {
    return directMatch;
  }

  return [...sourceByPath.entries()].find(([path]) => getLowerFileName(path) === fileName)?.[1];
}

function chunkNumberedFile(file: RepoReviewSourceFile): Array<{ lineStart: number; lineEnd: number; text: string }> {
  const lines = file.content.replace(/\r\n/g, "\n").split("\n");
  const chunks: Array<{ lineStart: number; lineEnd: number; text: string }> = [];
  let chunkStart = 0;
  let currentLines: string[] = [];
  let currentChars = 0;

  lines.forEach((line, index) => {
    const numbered = `${String(index + 1).padStart(4, " ")} | ${line}`;
    if (currentLines.length > 0 && currentChars + numbered.length > MAX_CHUNK_CHARS) {
      chunks.push({
        lineStart: chunkStart + 1,
        lineEnd: index,
        text: currentLines.join("\n")
      });
      chunkStart = index;
      currentLines = [];
      currentChars = 0;
    }

    currentLines.push(numbered);
    currentChars += numbered.length + 1;
  });

  if (currentLines.length > 0) {
    chunks.push({
      lineStart: chunkStart + 1,
      lineEnd: lines.length,
      text: currentLines.join("\n")
    });
  }

  return chunks;
}

function isIgnoredPath(filePath: string): boolean {
  const segments = filePath.split("/").map((segment) => segment.toLowerCase());
  const fileName = segments[segments.length - 1] ?? "";

  return segments.some((segment) => IGNORED_PATH_SEGMENTS.has(segment)) || IGNORED_FILE_NAMES.has(fileName);
}

function isSupportedTextFile(filePath: string): boolean {
  const fileName = getLowerFileName(filePath);
  return SUPPORTED_FILE_NAMES.has(fileName) || SUPPORTED_EXTENSIONS.has(getLowerExtension(filePath));
}

function scoreReviewPath(filePath: string, size: number): number {
  const normalized = filePath.toLowerCase();
  const fileName = getLowerFileName(filePath);
  const extension = getLowerExtension(filePath);
  let score = 0;

  if (["package.json", "pyproject.toml", "requirements.txt", "go.mod", "cargo.toml", "pom.xml", "build.gradle"].includes(fileName)) {
    score += 80;
  }

  if (/\b(src|app|pages|routes|controllers|services|lib|server|api|components)\b/u.test(normalized)) {
    score += 45;
  }

  if ([".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java", ".cs", ".php", ".rb"].includes(extension)) {
    score += 40;
  }

  if (/\b(test|tests|spec|__tests__|e2e)\b/u.test(normalized)) {
    score += 12;
  }

  if (/\b(config|middleware|auth|security|database|schema|model)\b/u.test(normalized)) {
    score += 18;
  }

  if (/\b(example|examples|demo|fixture|fixtures|mock|mocks|generated)\b/u.test(normalized)) {
    score -= 30;
  }

  if (extension === ".md" || extension === ".json" || extension === ".yaml" || extension === ".yml") {
    score -= 12;
  }

  score -= Math.min(20, Math.floor(size / 20_000));
  return score;
}

function languageFromFileName(filePath: string): string | null {
  const fileName = getLowerFileName(filePath);
  if (fileName === "dockerfile" || fileName === "docker-compose.yml" || fileName === "docker-compose.yaml") {
    return "Docker";
  }

  if (fileName === "makefile" || fileName === "cmakelists.txt") {
    return "Build config";
  }

  return null;
}

function getZipEntryUncompressedSize(entry: JSZip.JSZipObject): number {
  const compressedEntry = entry as JSZip.JSZipObject & {
    _data?: {
      uncompressedSize?: number;
    };
  };

  const uncompressedSize = compressedEntry._data?.uncompressedSize;
  return typeof uncompressedSize === "number" && Number.isFinite(uncompressedSize) ? uncompressedSize : 0;
}

function normalizeZipPath(filePath: string): string {
  return filePath
    .replace(/\\/g, "/")
    .split("/")
    .filter((segment) => segment.length > 0)
    .join("/");
}

function isSafeZipPath(filePath: string): boolean {
  const rawPath = filePath.replace(/\\/g, "/");
  const normalized = normalizeZipPath(rawPath);
  if (
    normalized.length === 0 ||
    rawPath.startsWith("/") ||
    /^[a-z]:/iu.test(rawPath) ||
    rawPath.includes("\u0000")
  ) {
    return false;
  }

  return rawPath
    .split("/")
    .filter((segment) => segment.length > 0)
    .every((segment) => segment !== "." && segment !== "..");
}

function buildRepoNameFromZipFilename(filename: string): string {
  const baseName = filename.split(/[\\/]/u).pop() ?? "uploaded-project";
  const withoutZip = baseName.replace(/\.zip$/iu, "");
  return sanitizeArchiveName(withoutZip) || "uploaded-project";
}

function buildCorrectedZipFilename(filename: string): string {
  return `${buildRepoNameFromZipFilename(filename)}-codementor-reviewed.zip`;
}

function sanitizeArchiveName(value: string): string {
  return value
    .replace(/^[a-z]:/iu, "")
    .replace(/[^a-z0-9._-]+/giu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildRepoReviewMarkdown(report: RepoReviewReport): string {
  const lines = [
    "# CodeMentorAI Repository Review",
    "",
    `Repository: ${report.repo.name}`,
    `Source: ${report.repo.url}`,
    `Files scanned: ${report.stats.filesScanned}`,
    `Languages/frameworks: ${report.stats.languages.join(", ") || "unknown"}`,
    "",
    "## Summary",
    "",
    report.summary,
    "",
    "## Findings",
    ""
  ];

  if (report.findings.length === 0) {
    lines.push("No concrete findings were returned for the selected source excerpts.", "");
  } else {
    report.findings.forEach((finding, index) => {
      lines.push(
        `### ${index + 1}. ${finding.title}`,
        "",
        `Severity: ${finding.severity}`,
        `File: ${finding.file}${finding.line ? `:${finding.line}` : ""}`,
        "",
        finding.description,
        "",
        `Recommendation: ${finding.recommendation}`,
        ""
      );

      if (finding.fix?.patch) {
        lines.push("Patch:", "", "```diff", finding.fix.patch, "```", "");
      }
    });
  }

  if (report.nextSteps.length > 0) {
    lines.push("## Next Steps", "");
    report.nextSteps.forEach((step) => {
      lines.push(`- ${step}`);
    });
    lines.push("");
  }

  if (report.fixes?.patch) {
    lines.push("## Combined Patch", "", "```diff", report.fixes.patch, "```", "");
  }

  return `${lines.join("\n").trim()}\n`;
}

function getLowerFileName(filePath: string): string {
  return filePath.split("/").pop()?.toLowerCase() ?? "";
}

function getLowerExtension(filePath: string): string {
  const fileName = getLowerFileName(filePath);
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex === -1 ? "" : fileName.slice(dotIndex);
}

function isValidGitHubOwner(owner: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/iu.test(owner);
}

function isValidGitHubRepo(repo: string): boolean {
  return /^[a-z0-9._-]+$/iu.test(repo) && repo !== "." && repo !== "..";
}

function readPositiveIntEnv(name: string, fallback: number): number {
  const rawValue = process.env[name];
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${bytes} B`;
}
