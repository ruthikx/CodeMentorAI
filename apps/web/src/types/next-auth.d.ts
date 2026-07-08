import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    tier?: "free" | "pro" | "team";
  }

  interface Session {
    apiToken?: string;
    user?: DefaultSession["user"] & {
      id: string;
      tier: "free" | "pro" | "team";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tier?: "free" | "pro" | "team";
    githubAccessToken?: string;
    accessTokenExpiresAt?: number;
    refreshWindowExpiresAt?: number;
  }
}
