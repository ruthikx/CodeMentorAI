import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import { decryptOAuthToken, encryptOAuthToken } from "./oauth-token-crypto";
import { prisma } from "./prisma";
import { normalizeTier, type UserTier } from "./tiers";

const SESSION_MAX_AGE_SECONDS = 60 * 60;
const REFRESH_WINDOW_SECONDS = 7 * 24 * 60 * 60;
const JWT_AUDIENCE = process.env.JWT_AUDIENCE;
const JWT_ISSUER = process.env.JWT_ISSUER;
const JWT_SECRET = process.env.JWT_SECRET;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS
  },
  jwt: {
    maxAge: REFRESH_WINDOW_SECONDS
  },
  pages: {
    signIn: "/login",
    newUser: "/signup"
  },
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          scope: "read:user user:email repo"
        }
      }
    }),
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase();
        const password = credentials?.password;
        const configuredEmail = process.env.AUTH_TEST_EMAIL;
        const configuredHash = process.env.AUTH_TEST_PASSWORD_HASH;
        const configuredPassword = process.env.AUTH_TEST_PASSWORD;

        if (!email || !password) {
          return null;
        }

        const dbUser = await prisma.user.findUnique({
          where: { email }
        });

        if (dbUser?.passwordHash) {
          const passwordMatches = await bcrypt.compare(password, dbUser.passwordHash);

          if (!passwordMatches) {
            return null;
          }

          await prisma.user.update({
            where: { id: dbUser.id },
            data: { lastActiveAt: new Date() }
          });

          return {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name ?? dbUser.email,
            tier: dbUser.tier
          };
        }

        if (email !== configuredEmail) {
          return null;
        }

        const passwordMatches = configuredHash
          ? await bcrypt.compare(password, configuredHash)
          : configuredPassword
            ? password === configuredPassword
            : false;

        if (!passwordMatches) {
          return null;
        }

        return {
          id: process.env.AUTH_TEST_USER_ID ?? email,
          email,
          name: process.env.AUTH_TEST_USER_NAME ?? "CodeMentor User"
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      const now = Math.floor(Date.now() / 1000);
      let resolvedTier: UserTier | undefined;

      if (account?.access_token) {
        token.githubAccessToken = encryptOAuthToken(account.access_token);
      }

      if (account?.provider === "github" && user?.email) {
        const githubId = account.providerAccountId ? BigInt(account.providerAccountId) : null;
        const dbUser = await prisma.user.upsert({
          where: { email: user.email.toLowerCase() },
          create: {
            email: user.email.toLowerCase(),
            name: user.name,
            avatarUrl: user.image,
            githubId,
            tier: "free",
            lastActiveAt: new Date()
          },
          update: {
            name: user.name,
            avatarUrl: user.image,
            githubId,
            lastActiveAt: new Date()
          }
        });

        token.sub = dbUser.id;
        resolvedTier = dbUser.tier;
      } else if (user?.id) {
        token.sub = user.id;
        resolvedTier = normalizeAuthTier(user.tier, normalizeAuthTier(token.tier));
      }

      resolvedTier = resolvedTier ?? await getPersistedUserTier(token.sub);
      token.tier = resolvedTier ?? normalizeAuthTier(token.tier);
      token.accessTokenExpiresAt = now + SESSION_MAX_AGE_SECONDS;
      token.refreshWindowExpiresAt = token.refreshWindowExpiresAt ?? now + REFRESH_WINDOW_SECONDS;

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.tier = normalizeAuthTier(token.tier);
      }

      session.expires = new Date(Number(token.accessTokenExpiresAt ?? 0) * 1000).toISOString();
      session.apiToken = signApiToken(token);
      return session;
    }
  }
};

function signApiToken(token: {
  sub?: string;
  email?: string | null;
  tier?: unknown;
  githubAccessToken?: string;
  accessTokenExpiresAt?: number;
}): string | undefined {
  if (!JWT_SECRET || !token.sub) {
    return undefined;
  }

  const githubAccessToken = getDecryptedGitHubAccessToken(token.githubAccessToken);

  return jwt.sign(
    {
      sub: token.sub,
      email: typeof token.email === "string" ? token.email : undefined,
      tier: normalizeAuthTier(token.tier),
      githubAccessToken
    },
    JWT_SECRET,
    {
      algorithm: "HS256",
      audience: JWT_AUDIENCE,
      issuer: JWT_ISSUER,
      expiresIn: Math.max(1, Number(token.accessTokenExpiresAt ?? 0) - Math.floor(Date.now() / 1000))
    }
  );
}

function getDecryptedGitHubAccessToken(encryptedToken: string | undefined): string | undefined {
  if (!encryptedToken) {
    return undefined;
  }

  try {
    return decryptOAuthToken(encryptedToken);
  } catch {
    return undefined;
  }
}

function normalizeAuthTier(value: unknown, fallback: UserTier = "free"): UserTier {
  return typeof value === "string" ? normalizeTier(value, fallback) : fallback;
}

async function getPersistedUserTier(userId: string | undefined): Promise<UserTier | undefined> {
  if (!userId || !UUID_PATTERN.test(userId)) {
    return undefined;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true }
  });

  return dbUser?.tier;
}
