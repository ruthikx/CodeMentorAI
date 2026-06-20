-- CreateEnum
CREATE TYPE "UserTier" AS ENUM ('free', 'pro', 'team');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('pending', 'processing', 'complete', 'failed');

-- CreateEnum
CREATE TYPE "ReviewProvider" AS ENUM ('groq', 'gemini');

-- CreateEnum
CREATE TYPE "ReviewSeverity" AS ENUM ('style', 'best_practice', 'logic', 'security');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "githubId" BIGINT,
    "tier" "UserTier" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodeSubmission" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "language" VARCHAR(100) NOT NULL,
    "sourceCode" TEXT NOT NULL,
    "filename" TEXT,
    "githubPrId" BIGINT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodeSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewResult" (
    "id" UUID NOT NULL,
    "submissionId" UUID NOT NULL,
    "status" "ReviewStatus" NOT NULL,
    "totalIssues" INTEGER NOT NULL DEFAULT 0,
    "modelUsed" TEXT,
    "providerUsed" "ReviewProvider" NOT NULL,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ReviewResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewIssue" (
    "id" UUID NOT NULL,
    "reviewId" UUID NOT NULL,
    "severity" "ReviewSeverity" NOT NULL,
    "category" TEXT NOT NULL,
    "lineStart" INTEGER NOT NULL,
    "lineEnd" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "suggestedFix" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ReviewIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningMetrics" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "totalSubmissions" INTEGER NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "issuesResolved" INTEGER NOT NULL DEFAULT 0,
    "averageResolutionRate" DOUBLE PRECISION,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_githubId_key" ON "User"("githubId");

-- CreateIndex
CREATE INDEX "CodeSubmission_userId_submittedAt_idx" ON "CodeSubmission"("userId", "submittedAt");

-- CreateIndex
CREATE INDEX "CodeSubmission_githubPrId_idx" ON "CodeSubmission"("githubPrId");

-- CreateIndex
CREATE INDEX "ReviewIssue_reviewId_idx" ON "ReviewIssue"("reviewId");

-- CreateIndex
CREATE INDEX "ReviewIssue_severity_category_idx" ON "ReviewIssue"("severity", "category");

-- CreateIndex
CREATE UNIQUE INDEX "LearningMetrics_userId_key" ON "LearningMetrics"("userId");

-- AddForeignKey
ALTER TABLE "CodeSubmission" ADD CONSTRAINT "CodeSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewResult" ADD CONSTRAINT "ReviewResult_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "CodeSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewIssue" ADD CONSTRAINT "ReviewIssue_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "ReviewResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningMetrics" ADD CONSTRAINT "LearningMetrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
