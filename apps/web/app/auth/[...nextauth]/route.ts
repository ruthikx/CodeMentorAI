import bcrypt from "bcryptjs";
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import { encryptOAuthToken } from "../../../src/lib/oauth-token-crypto";

const SESSION_MAX_AGE_SECONDS = 60 * 60;
const REFRESH_WINDOW_SECONDS = 7 * 24 * 60 * 60;

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
        const email = credentials?.email;
        const password = credentials?.password;
        const configuredEmail = process.env.AUTH_TEST_EMAIL;
        const configuredHash = process.env.AUTH_TEST_PASSWORD_HASH;
        const configuredPassword = process.env.AUTH_TEST_PASSWORD;

        if (!email || !password || email !== configuredEmail) {
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

      if (user?.id) {
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
      return session;
    }
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
