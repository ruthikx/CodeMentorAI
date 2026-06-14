import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
import type { AuthenticatedUser, UserTier } from "../types/auth.js";

const JWT_AUDIENCE = process.env.JWT_AUDIENCE;
const JWT_ISSUER = process.env.JWT_ISSUER;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, "\n");

export function authMiddleware(request: Request, response: Response, next: NextFunction): void {
  if (request.path.startsWith("/auth/") || request.path === "/api/github/webhook") {
    next();
    return;
  }

  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    response.status(401).json({ error: "Missing Bearer token." });
    return;
  }

  const token = authorization.slice("Bearer ".length);

  try {
    const decoded = jwt.verify(token, JWT_PUBLIC_KEY ?? JWT_SECRET ?? "", {
      audience: JWT_AUDIENCE,
      issuer: JWT_ISSUER,
      algorithms: JWT_PUBLIC_KEY ? ["RS256"] : ["HS256"]
    }) as jwt.JwtPayload;

    const tier = normalizeTier(decoded.tier);
    (request as AuthenticatedRequest).auth = {
      userId: String(decoded.sub),
      email: typeof decoded.email === "string" ? decoded.email : null,
      tier,
      githubAccessToken:
        typeof decoded.githubAccessToken === "string" ? decoded.githubAccessToken : null
    } satisfies AuthenticatedUser;

    next();
  } catch (error) {
    response.status(401).json({
      error: "Invalid token.",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
}

function normalizeTier(value: unknown): UserTier {
  if (value === "pro" || value === "team") {
    return value;
  }

  return "free";
}
