import { createDecipheriv, createHash } from "node:crypto";

/** Mirrors `apps/api/src/crypto.ts` — worker/runtime processes must load the same `ENCRYPTION_MASTER_KEY`. */
export function decryptIntegrationPayload(payload: string, masterKey: string): string {
  const key = createHash("sha256").update(masterKey).digest();
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

export function getEncryptionMasterKeyFromEnv(): string {
  const key = process.env.ENCRYPTION_MASTER_KEY?.trim();
  if (!key || key.length < 32) {
    throw new Error("ENCRYPTION_MASTER_KEY missing or too short — required for integration decryption");
  }
  return key;
}
