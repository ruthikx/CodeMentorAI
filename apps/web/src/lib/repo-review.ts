export type RepoReviewSeverity = "critical" | "high" | "medium" | "low";

export interface RepoReviewCorrectedFile {
  file: string;
  content: string;
}

export interface RepoReviewFixArtifacts {
  patch: string | null;
  correctedFiles: RepoReviewCorrectedFile[];
}

export interface RepoReviewFix {
  lineStart: number;
  lineEnd: number;
  replacement: string;
  patch: string | null;
  correctedFile: RepoReviewCorrectedFile | null;
}

export interface RepoReviewFinding {
  severity: RepoReviewSeverity;
  title: string;
  file: string;
  line: number | null;
  description: string;
  recommendation: string;
  fix?: RepoReviewFix | null;
}

export interface RepoReviewReport {
  summary: string;
  repo: {
    url: string;
    name: string;
    defaultBranch: string;
  };
  stats: {
    filesScanned: number;
    languages: string[];
  };
  findings: RepoReviewFinding[];
  nextSteps: string[];
  fixes?: RepoReviewFixArtifacts;
}
