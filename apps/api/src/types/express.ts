import type { Request } from "express";
import type { AuthenticatedUser } from "./auth.js";

export interface AuthenticatedRequest<
  Params = Record<string, string>,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Record<string, string | string[] | undefined>
> extends Request<Params, ResBody, ReqBody, ReqQuery> {
  auth: AuthenticatedUser;
  rawBody?: Buffer;
}
