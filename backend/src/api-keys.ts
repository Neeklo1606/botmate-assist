import { createHash, randomBytes } from "crypto";
import { prisma } from "./prisma";
import { ApiKeyPublic } from "./types";

function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export interface VerifiedApiKey {
  apiKeyId: string;
  tenantId: string;
  userId: string;
  assistantId?: string;
}

function toPublic(row: {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  keyPrefix: string;
  assistantId: string | null;
  allowedDomains: unknown;
  rateLimitPerMin: number;
  isActive: boolean;
  createdAt: Date;
  revokedAt: Date | null;
}): ApiKeyPublic {
  return {
    id: row.id,
    tenantId: row.tenantId,
    userId: row.userId,
    name: row.name,
    keyPrefix: row.keyPrefix,
    assistantId: row.assistantId ?? undefined,
    allowedDomains: Array.isArray(row.allowedDomains)
      ? (row.allowedDomains.filter((x) => typeof x === "string") as string[])
      : undefined,
    rateLimitPerMin: row.rateLimitPerMin,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    revokedAt: row.revokedAt?.toISOString(),
  };
}

export async function createApiKey(input: {
  tenantId: string;
  userId: string;
  name: string;
  assistantId?: string;
  allowedDomains?: string[];
  rateLimitPerMin?: number;
}): Promise<{ apiKey: string; item: ApiKeyPublic }> {
  const raw = `bm_${randomBytes(24).toString("base64url")}`;
  const keyHash = hashApiKey(raw);
  const keyPrefix = raw.slice(0, 10);
  const row = await prisma.apiKey.create({
    data: {
      tenantId: input.tenantId,
      userId: input.userId,
      name: input.name,
      keyPrefix,
      keyHash,
      assistantId: input.assistantId,
      allowedDomains: input.allowedDomains ?? [],
      rateLimitPerMin: input.rateLimitPerMin ?? 60,
      isActive: true,
    },
  });
  return {
    apiKey: raw,
    item: toPublic(row),
  };
}

export async function listApiKeys(input: {
  tenantId: string;
  userId: string;
}): Promise<ApiKeyPublic[]> {
  const rows = await prisma.apiKey.findMany({
    where: {
      tenantId: input.tenantId,
      userId: input.userId,
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toPublic);
}

export async function revokeApiKey(input: {
  id: string;
  tenantId: string;
  userId: string;
}): Promise<boolean> {
  const result = await prisma.apiKey.updateMany({
    where: {
      id: input.id,
      tenantId: input.tenantId,
      userId: input.userId,
      isActive: true,
    },
    data: {
      isActive: false,
      revokedAt: new Date(),
    },
  });
  return result.count > 0;
}

export async function verifyApiKeyRaw(raw: string): Promise<{
  status: "valid" | "invalid" | "revoked";
  value?: VerifiedApiKey;
}> {
  const keyHash = hashApiKey(raw);
  const row = await prisma.apiKey.findUnique({
    where: { keyHash },
    select: {
      id: true,
      tenantId: true,
      userId: true,
      assistantId: true,
      isActive: true,
      revokedAt: true,
    },
  });
  if (!row) {
    return { status: "invalid" };
  }
  if (!row.isActive || row.revokedAt) {
    return { status: "revoked" };
  }
  return {
    status: "valid",
    value: {
      apiKeyId: row.id,
      tenantId: row.tenantId,
      userId: row.userId,
      assistantId: row.assistantId ?? undefined,
    },
  };
}
