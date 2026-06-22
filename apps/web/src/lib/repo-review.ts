export type RepoReviewSeverity = "critical" | "high" | "medium" | "low";

export interface RepoReviewFinding {
  severity: RepoReviewSeverity;
  title: string;
  file: string;
  line: number | null;
  description: string;
  recommendation: string;
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
}
