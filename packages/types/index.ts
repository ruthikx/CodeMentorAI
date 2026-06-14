export type UserTier = "free" | "pro" | "team";

export type ReviewStatus = "pending" | "processing" | "complete" | "failed";

export type ReviewProvider = "groq" | "gemini";

export type ReviewSeverity = "style" | "best_practice" | "logic" | "security";

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  githubId: bigint | null;
  tier: UserTier;
  createdAt: Date;
  lastActiveAt: Date | null;
}

export interface CodeSubmission {
  id: string;
  userId: string;
  language: string;
  sourceCode: string;
  filename: string | null;
  githubPrId: bigint | null;
  submittedAt: Date;
}

export interface ReviewResult {
  id: string;
  submissionId: string;
  status: ReviewStatus;
  totalIssues: number;
  modelUsed: string | null;
  providerUsed: ReviewProvider;
  promptTokens: number | null;
  completionTokens: number | null;
  completedAt: Date | null;
}

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

export interface LearningMetrics {
  id: string;
  userId: string;
  totalSubmissions: number;
  totalReviews: number;
  issuesResolved: number;
  averageResolutionRate: number | null;
  currentStreak: number;
  longestStreak: number;
  updatedAt: Date;
}
