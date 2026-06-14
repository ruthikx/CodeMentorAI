import { Router } from "express";

export const authRouter = Router();

authRouter.get("/health", (_request, response) => {
  response.json({ ok: true });
});
