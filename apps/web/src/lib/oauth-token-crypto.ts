import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;

function getEncryptionKey(): Buffer {
  const secret = process.env.GITHUB_TOKEN_ENCRYPTION_KEY ?? process.env.NEXTAUTH_SECRET ?? "";
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptOAuthToken(token: string): string {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv, authTag, encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptOAuthToken(payload: string): string {
  const [iv, authTag, encrypted] = payload.split(".").map((part) => Buffer.from(part, "base64url"));
  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
