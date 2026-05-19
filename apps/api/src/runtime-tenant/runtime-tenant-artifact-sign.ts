import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_SEC = 900;

function signingSecret(): string {
  const s = process.env.BOTMATE_ARTIFACT_SIGNING_SECRET?.trim() || process.env.ENCRYPTION_MASTER_KEY?.trim();
  if (!s) throw new Error("artifact_signing_secret_missing");
  return s;
}

export interface ArtifactSignedWire {
  tenantId: string;
  userId: string;
  artifactId: string;
  exp: number;
}

export function issueArtifactSignedDownload(input: {
  tenantId: string;
  userId: string;
  artifactId: string;
}): { token: string; expiresAtIso: string } {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SEC;
  const payloadObj: ArtifactSignedWire = {
    tenantId: input.tenantId,
    userId: input.userId,
    artifactId: input.artifactId,
    exp,
  };
  const payload = Buffer.from(JSON.stringify(payloadObj), "utf8").toString("base64url");
  const sig = createHmac("sha256", signingSecret()).update(payload).digest("base64url");
  const token = `${payload}.${sig}`;
  return { token, expiresAtIso: new Date(exp * 1000).toISOString() };
}

export function verifyArtifactSignedDownload(token: string): ArtifactSignedWire | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", signingSecret()).update(payload).digest("base64url");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(sig, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const rec = parsed as Record<string, unknown>;
  const tenantId = typeof rec.tenantId === "string" ? rec.tenantId : "";
  const userId = typeof rec.userId === "string" ? rec.userId : "";
  const artifactId = typeof rec.artifactId === "string" ? rec.artifactId : "";
  const exp = typeof rec.exp === "number" ? rec.exp : 0;
  if (!tenantId || !userId || !artifactId || exp <= 0) return null;
  if (Math.floor(Date.now() / 1000) > exp) return null;
  return { tenantId, userId, artifactId, exp };
}
