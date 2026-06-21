import crypto from "node:crypto";

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
}

export interface GitHubPullRequestFile {
  filename: string;
  patch?: string;
}

export function verifyGitHubSignature(payload: Buffer, signature: string | undefined): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret || !signature) {
    return false;
  }

  const digest = `sha256=${crypto.createHmac("sha256", secret).update(payload).digest("hex")}`;
  const expected = Buffer.from(digest);
  const received = Buffer.from(signature);

  if (expected.length !== received.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, received);
}

export async function fetchGitHubRepos(accessToken: string): Promise<GitHubRepo[]> {
  const response = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json"
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub repos request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as Array<Record<string, unknown>>;
  return payload.map((repo) => ({
    id: Number(repo.id),
    name: String(repo.name),
    fullName: String(repo.full_name),
    private: Boolean(repo.private)
  }));
}

export async function fetchPullRequestFiles(params: {
  accessToken: string;
  repoFullName: string;
  prNumber: number;
}): Promise<GitHubPullRequestFile[]> {
  const response = await fetch(
    `https://api.github.com/repos/${params.repoFullName}/pulls/${params.prNumber}/files?per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        Accept: "application/vnd.github+json"
      }
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub PR files request failed with status ${response.status}.`);
  }

  return (await response.json()) as GitHubPullRequestFile[];
}

export async function createPullRequestComment(params: {
  accessToken: string;
  repoFullName: string;
  prNumber: number;
  body: string;
}): Promise<void> {
  const response = await fetch(`https://api.github.com/repos/${params.repoFullName}/issues/${params.prNumber}/comments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ body: params.body })
  });

  if (!response.ok) {
    throw new Error(`GitHub PR comment request failed with status ${response.status}.`);
  }
}

export async function mergePullRequest(params: {
  accessToken: string;
  repoFullName: string;
  prNumber: number;
}): Promise<{ merged: boolean; message: string }> {
  const response = await fetch(`https://api.github.com/repos/${params.repoFullName}/pulls/${params.prNumber}/merge`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      commit_title: `Merge pull request #${params.prNumber}`,
      merge_method: "merge"
    })
  });

  const payload = (await response.json().catch(() => ({}))) as { merged?: boolean; message?: string };

  if (!response.ok) {
    throw new Error(payload.message ?? `GitHub PR merge request failed with status ${response.status}.`);
  }

  return {
    merged: Boolean(payload.merged),
    message: payload.message ?? "Pull request merged."
  };
}
