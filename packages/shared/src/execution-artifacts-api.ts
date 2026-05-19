import { z } from "zod";

export const RuntimeArtifactsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  browserSessionId: z.string().trim().min(1).optional(),
});

export type RuntimeArtifactsQuery = z.infer<typeof RuntimeArtifactsQuerySchema>;

export const RuntimeArtifactRowSchema = z.object({
  id: z.string(),
  kind: z.string(),
  browserSessionId: z.string(),
  browserRunId: z.string().nullable(),
  byteLength: z.string(),
  contentType: z.string().nullable(),
  storageKeySuffix: z.string(),
  metadataPreview: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
});

export const RuntimeArtifactsListResponseSchema = z.object({
  ok: z.literal(true),
  projection: z.literal("tenant_browser_artifact_index_v1"),
  items: z.array(RuntimeArtifactRowSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});

export const RuntimeArtifactPreviewDescriptorSchema = z.object({
  transport: z.literal("workspace_cookie_binary"),
  hrefPath: z.string().min(1),
  /** False when API host lacks shared artifact filesystem (`BROWSER_ARTIFACT_ROOT`). */
  available: z.boolean(),
});

export const RuntimeArtifactDetailResponseSchema = z.object({
  ok: z.literal(true),
  projection: z.literal("tenant_browser_artifact_detail_v1"),
  artifact: RuntimeArtifactRowSchema.extend({
    sha256: z.string().nullable(),
    expiresAt: z.string().nullable(),
    deletedAt: z.string().nullable(),
  }),
  preview: RuntimeArtifactPreviewDescriptorSchema,
});

export type RuntimeArtifactsListResponse = z.infer<typeof RuntimeArtifactsListResponseSchema>;
export type RuntimeArtifactDetailResponse = z.infer<typeof RuntimeArtifactDetailResponseSchema>;
