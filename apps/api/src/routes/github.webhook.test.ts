import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import express from "express";
import request from "supertest";
import { githubRouter } from "./github.js";
import { errorHandler } from "../middleware/error-handler.js";

function createWebhookTestApp() {
  const app = express();

  app.use("/api/github/webhook", express.raw({ type: "*/*", limit: "1mb" }));
  app.use((req, _res, next) => {
    if (Buffer.isBuffer(req.body)) {
      (req as typeof req & { rawBody?: Buffer }).rawBody = req.body;
    }
    next();
  });
  app.use("/api/github", githubRouter);
  app.use(errorHandler);

  return app;
}

function signPayload(secret: string, payload: Buffer): string {
  return `sha256=${crypto.createHmac("sha256", secret).update(payload).digest("hex")}`;
}

test("POST /api/github/webhook rejects an invalid HMAC-SHA256 signature", async () => {
  process.env.GITHUB_WEBHOOK_SECRET = "test-webhook-secret";
  const app = createWebhookTestApp();
  const payload = Buffer.from(JSON.stringify({ action: "opened" }), "utf8");

  const response = await request(app)
    .post("/api/github/webhook")
    .set("Content-Type", "application/json")
    .set("x-hub-signature-256", "sha256=invalid-signature")
    .send(payload);

  assert.equal(response.status, 401);
  assert.deepEqual(response.body, { error: "Invalid GitHub signature." });
});

test("POST /api/github/webhook accepts a valid HMAC-SHA256 signature", async () => {
  const secret = "test-webhook-secret";
  process.env.GITHUB_WEBHOOK_SECRET = secret;
  const app = createWebhookTestApp();
  const payload = Buffer.from(JSON.stringify({ action: "synchronize" }), "utf8");

  const response = await request(app)
    .post("/api/github/webhook")
    .set("Content-Type", "application/json")
    .set("x-hub-signature-256", signPayload(secret, payload))
    .send(payload);

  assert.equal(response.status, 202);
  assert.deepEqual(response.body, { accepted: true });
});
