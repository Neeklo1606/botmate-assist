import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || "";

function getAesKey(): Buffer {
  if (!MASTER_KEY) {
    throw new Error("ENCRYPTION_MASTER_KEY is not configured");
  }
  return createHash("sha256").update(MASTER_KEY).digest();
}

export function encryptText(plainText: string): string {
  const key = getAesKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptText(payload: string): string {
  const key = getAesKey();
  const [ivPart, tagPart, encryptedPart] = payload.split(":");
  if (!ivPart || !tagPart || !encryptedPart) {
    throw new Error("Invalid encrypted payload format");
  }
  const iv = Buffer.from(ivPart, "base64");
  const authTag = Buffer.from(tagPart, "base64");
  const encrypted = Buffer.from(encryptedPart, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const plain = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return plain.toString("utf8");
}
