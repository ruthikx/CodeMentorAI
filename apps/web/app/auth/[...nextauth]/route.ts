import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import { encryptOAuthToken } from "../../../src/lib/oauth-token-crypto";
import { prisma } from "../../../src/lib/prisma";

const SESSION_MAX_AGE_SECONDS = 60 * 60;
const REFRESH_WINDOW_SECONDS = 7 * 24 * 60 * 60;
const JWT_AUDIENCE = process.env.JWT_AUDIENCE;
const JWT_ISSUER = process.env.JWT_ISSUER;
const JWT_SECRET = process.env.JWT_SECRET;

const authOptions: NextAuthOptions = {
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
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? ""
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
            name: dbUser.name ?? dbUser.email
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
        token.tier = dbUser.tier;
      } else if (user?.id) {
        token.sub = user.id;
      }

      token.tier = token.tier ?? "free";
      token.accessTokenExpiresAt = now + SESSION_MAX_AGE_SECONDS;
      token.refreshWindowExpiresAt = token.refreshWindowExpiresAt ?? now + REFRESH_WINDOW_SECONDS;

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.tier = token.tier === "pro" || token.tier === "team" ? token.tier : "free";
      }

      session.expires = new Date(Number(token.accessTokenExpiresAt ?? 0) * 1000).toISOString();
      session.apiToken = signApiToken(token);
      return session;
    }
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

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

  return jwt.sign(
    {
      sub: token.sub,
      email: typeof token.email === "string" ? token.email : undefined,
      tier: token.tier === "pro" || token.tier === "team" ? token.tier : "free",
      githubAccessToken: token.githubAccessToken
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
