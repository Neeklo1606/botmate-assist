import { z } from "zod";
import { createPaginatedSchema, PaginationQuerySchema } from "./pagination.js";

/** Mirrors `entities.ChannelId`. */
export const ChannelIdSchema = z.enum([
  "telegram",
  "website",
  "avito",
  "vk",
  "whatsapp",
  "instagram",
]);

export type AssistantChannelId = z.infer<typeof ChannelIdSchema>;

/** Mirrors `entities.Niche`. */
export const AssistantNicheSchema = z.enum([
  "real_estate",
  "auto",
  "clinic",
  "services",
  "online_school",
  "agency",
  "other",
]);

export type AssistantNiche = z.infer<typeof AssistantNicheSchema>;

export const AssistantStatusSchema = z.enum(["draft", "active", "paused"]);
export type AssistantStatus = z.infer<typeof AssistantStatusSchema>;

/**
 * Wire shape aligned with UI `Assistant` (metrics + channels flattened).
 * Prompt/tools/model payloads live only in DB `settings` and are **not** exposed here (Phase 2B anti-leak).
 */
export const AssistantDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  niche: AssistantNicheSchema,
  status: AssistantStatusSchema,
  channels: z.array(ChannelIdSchema),
  conversations7d: z.number().int().nonnegative(),
  leads7d: z.number().int().nonnegative(),
  conversion: z.number().min(0).max(1),
  updatedAt: z.string(),
  /** Optional link to a workspace project (same tenant). */
  projectId: z.string().nullable().optional(),
});

export type AssistantDto = z.infer<typeof AssistantDtoSchema>;

export const AssistantsListResponseSchema = createPaginatedSchema(AssistantDtoSchema);
export type AssistantsListResponse = z.infer<typeof AssistantsListResponseSchema>;

export const AssistantsListQuerySchema = PaginationQuerySchema;
export type AssistantsListQuery = z.infer<typeof AssistantsListQuerySchema>;

export const CreateAssistantBodySchema = z.object({
  name: z.string().min(1).max(200),
  niche: AssistantNicheSchema,
  projectId: z.string().min(1).optional(),
  channels: z.array(ChannelIdSchema).optional(),
});

export type CreateAssistantBody = z.infer<typeof CreateAssistantBodySchema>;

/** Partial update — flattened metrics/channels merge into `settings` JSON server-side. */
export const PatchAssistantBodySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    niche: AssistantNicheSchema.optional(),
    status: AssistantStatusSchema.optional(),
    projectId: z.union([z.string().min(1), z.null()]).optional(),
    channels: z.array(ChannelIdSchema).optional(),
    conversations7d: z.number().int().nonnegative().optional(),
    leads7d: z.number().int().nonnegative().optional(),
    conversion: z.number().min(0).max(1).optional(),
    /** Shallow-merge top-level keys into stored `settings` (includes prompt/tools/model when provided). */
    settings: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export type PatchAssistantBody = z.infer<typeof PatchAssistantBodySchema>;

export const AssistantArchiveResponseSchema = z.object({
  ok: z.literal(true),
});

export type AssistantArchiveResponse = z.infer<typeof AssistantArchiveResponseSchema>;
