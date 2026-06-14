export type UserTier = "free" | "pro" | "team";

export interface AuthenticatedUser {
  userId: string;
  email: string | null;
  tier: UserTier;
  githubAccessToken?: string | null;
}
