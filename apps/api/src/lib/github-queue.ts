import Bull from "bull";
import { fetchPullRequestFiles } from "./github.js";
import { prisma } from "./prisma.js";
import { runReviewGeneration } from "./review-runner.js";

const redisUrl = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";

export interface GitHubReviewJob {
  reviewId: string;
  submissionId: string;
  userId: string;
  repoFullName: string;
  prNumber: number;
  githubAccessToken: string;
}

export const githubReviewQueue = new Bull<GitHubReviewJob>("github-pr-reviews", redisUrl);

githubReviewQueue.process(async (job) => {
  const files = await fetchPullRequestFiles({
    accessToken: job.data.githubAccessToken,
    repoFullName: job.data.repoFullName,
    prNumber: job.data.prNumber
  });

  const sourceCode = files
    .filter((file) => file.patch)
    .map((file) => `// File: ${file.filename}\n${file.patch ?? ""}`)
    .join("\n\n");

  await prisma.codeSubmission.update({
    where: { id: job.data.submissionId },
    data: {
      sourceCode,
      filename: `${job.data.repoFullName}#${job.data.prNumber}`,
      githubPrId: job.data.prNumber
    }
  });

  await runReviewGeneration({
    reviewId: job.data.reviewId,
    submissionId: job.data.submissionId,
    userId: job.data.userId,
    language: "diff",
    sourceCode
  });
});
