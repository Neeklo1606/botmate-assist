import { z } from "zod";

export const ApiKeyPublicSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  userId: z.string(),
  name: z.string(),
  keyPrefix: z.string(),
  assistantId: z.string().optional(),
  allowedDomains: z.array(z.string()).optional(),
  rateLimitPerMin: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  revokedAt: z.string().optional(),
});

export type ApiKeyPublic = z.infer<typeof ApiKeyPublicSchema>;

export const ApiKeysListResponseSchema = z.object({
  items: z.array(ApiKeyPublicSchema),
});

export const CreateApiKeyBodySchema = z.object({
  name: z.string().min(1).max(120),
  assistantId: z.string().optional(),
  allowedDomains: z.array(z.string()).optional(),
  rateLimitPerMin: z.number().int().positive().optional(),
});

export type CreateApiKeyBody = z.infer<typeof CreateApiKeyBodySchema>;

export const CreateApiKeyResponseSchema = ApiKeyPublicSchema.extend({
  apiKey: z.string(),
});

export type CreateApiKeyResponse = z.infer<typeof CreateApiKeyResponseSchema>;
