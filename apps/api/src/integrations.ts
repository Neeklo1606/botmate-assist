import { decryptText, encryptText } from "./crypto";
import { IntegrationAccount } from "./types";
import { prisma } from "@botmate/database";

export function maskApiKey(raw: string): string {
  if (raw.length <= 8) return "****";
  return `${raw.slice(0, 4)}...${raw.slice(-4)}`;
}

export async function upsertOpenAiIntegration(input: {
  userId: string;
  apiKey: string;
}): Promise<IntegrationAccount> {
  const encrypted = encryptText(input.apiKey);
  const row = await prisma.integrationAccount.upsert({
    where: {
      userId_provider: {
        userId: input.userId,
        provider: "OPENAI",
      },
    },
    update: {
      apiKeyEncrypted: encrypted,
      isActive: true,
    },
    create: {
      userId: input.userId,
      provider: "OPENAI",
      apiKeyEncrypted: encrypted,
      isActive: true,
    },
  });
  return {
    id: row.id,
    userId: row.userId,
    provider: "OPENAI",
    apiKeyEncrypted: row.apiKeyEncrypted,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getActiveOpenAiIntegration(
  userId: string,
): Promise<IntegrationAccount | null> {
  const row = await prisma.integrationAccount.findFirst({
    where: { userId, provider: "OPENAI", isActive: true },
  });
  if (!row) return null;
  return {
    id: row.id,
    userId: row.userId,
    provider: "OPENAI",
    apiKeyEncrypted: row.apiKeyEncrypted,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function revokeOpenAiIntegration(userId: string): Promise<boolean> {
  const result = await prisma.integrationAccount.updateMany({
    where: { userId, provider: "OPENAI", isActive: true },
    data: { isActive: false },
  });
  return result.count > 0;
}

export function decryptIntegrationApiKey(integration: IntegrationAccount): string {
  return decryptText(integration.apiKeyEncrypted);
}
