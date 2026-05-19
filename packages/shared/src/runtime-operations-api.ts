import { z } from "zod";
import { RuntimePaginationQuerySchema } from "./runtime-tenant-api.js";

/** GET `/runtime/executions/:id/notes` — same pagination as tenant runtime lists. */
export const RuntimeExecutionNotesQuerySchema = RuntimePaginationQuerySchema;
export type RuntimeExecutionNotesQuery = z.infer<typeof RuntimeExecutionNotesQuerySchema>;

export const RuntimeArtifactPreviewTokenSchema = z.object({});

export const RuntimeExecutionNoteCreateResponseSchema = z.object({
  ok: z.literal(true),
  id: z.string(),
  executionId: z.string(),
  body: z.string(),
  createdAt: z.string(),
  userId: z.string(),
});
export type RuntimeExecutionNoteCreateResponse = z.infer<typeof RuntimeExecutionNoteCreateResponseSchema>;

export const RuntimeActivityFactSeveritySchema = z.enum(["info", "warn", "critical"]);
export type RuntimeActivityFactSeverity = z.infer<typeof RuntimeActivityFactSeveritySchema>;

export const RuntimeActivityFactRowSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  dedupeKey: z.string(),
  ts: z.string(),
  kind: z.string(),
  severity: RuntimeActivityFactSeveritySchema,
  traceId: z.string().nullable(),
  executionId: z.string().nullable(),
  correlationId: z.string().nullable(),
  summary: z.string(),
  payload: z.record(z.string(), z.unknown()).nullable(),
  expiresAt: z.string().nullable(),
});

export const RuntimeActivityFactsQuerySchema = RuntimePaginationQuerySchema.extend({
  kindPrefix: z.string().trim().min(1).max(128).optional(),
});
export type RuntimeActivityFactsQuery = z.infer<typeof RuntimeActivityFactsQuerySchema>;

export const RuntimeActivityFactsResponseSchema = z.object({
  ok: z.literal(true),
  projection: z.literal("tenant_runtime_activity_facts_v1"),
  items: z.array(RuntimeActivityFactRowSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});

export const RuntimeBookmarkUpsertBodySchema = z.object({
  executionId: z.string().min(1).max(512),
  note: z.string().trim().max(512).optional(),
});

export const RuntimeBookmarkRowSchema = z.object({
  ok: z.literal(true),
  id: z.string(),
  executionId: z.string(),
  note: z.string().nullable(),
  createdAt: z.string(),
});

export const RuntimeExecutionNoteCreateBodySchema = z.object({
  body: z.string().trim().min(1).max(16_000),
});

export const RuntimeExecutionNoteRowSchema = z.object({
  id: z.string(),
  executionId: z.string(),
  body: z.string(),
  createdAt: z.string(),
  userId: z.string(),
});

export const RuntimeExecutionNotesResponseSchema = z.object({
  ok: z.literal(true),
  items: z.array(RuntimeExecutionNoteRowSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});

export const RuntimeIncidentSeveritySchema = z.enum(["info", "warn", "critical"]);
export type RuntimeIncidentSeverity = z.infer<typeof RuntimeIncidentSeveritySchema>;

export const RuntimeIncidentClusterSchema = z.enum([
  "consistency",
  "reconcile",
  "policy",
  "browser",
  "queue",
  "correlation",
  "governance_mark",
  "replay",
]);
export type RuntimeIncidentCluster = z.infer<typeof RuntimeIncidentClusterSchema>;

export const RuntimeIncidentRowSchema = z.object({
  incidentKey: z.string(),
  cluster: RuntimeIncidentClusterSchema,
  severity: RuntimeIncidentSeveritySchema,
  title: z.string(),
  summary: z.string(),
  traceId: z.string().nullable(),
  executionId: z.string().nullable(),
  correlationId: z.string().nullable(),
  sampleIds: z.array(z.string()),
  remediationHints: z.array(z.string()),
});

export type RuntimeIncidentRow = z.infer<typeof RuntimeIncidentRowSchema>;

export const RuntimeIncidentsResponseSchema = z.object({
  ok: z.literal(true),
  projection: z.literal("tenant_runtime_incidents_v1"),
  generatedAt: z.string(),
  items: z.array(RuntimeIncidentRowSchema),
});

export const RuntimeIncidentsQuerySchema = z.object({
  cluster: RuntimeIncidentClusterSchema.optional(),
  severity: RuntimeIncidentSeveritySchema.optional(),
});

export type RuntimeIncidentsQuery = z.infer<typeof RuntimeIncidentsQuerySchema>;

export const RuntimeIncidentAckBodySchema = z.object({
  incidentKey: z.string().min(1).max(512),
  mutedUntil: z.string().min(1).max(64).optional(),
  assigneeLabel: z.string().trim().max(160).optional(),
});

export const RuntimeIncidentAckRowSchema = z.object({
  ok: z.literal(true),
  incidentKey: z.string(),
  acknowledgedAt: z.string(),
  mutedUntil: z.string().nullable(),
  assigneeLabel: z.string().nullable(),
});

export const ExecutionOperationalMarkBodySchema = z
  .object({
    frozen: z.boolean().optional(),
    escalated: z.boolean().optional(),
    replayBlocked: z.boolean().optional(),
    governanceQuarantine: z.boolean().optional(),
  })
  .refine(
    (v) =>
      v.frozen !== undefined ||
      v.escalated !== undefined ||
      v.replayBlocked !== undefined ||
      v.governanceQuarantine !== undefined,
    { message: "at_least_one_mark_required" },
  );

export const ExecutionOperationalMarkRowSchema = z.object({
  ok: z.literal(true),
  tenantId: z.string(),
  executionId: z.string(),
  frozen: z.boolean(),
  escalated: z.boolean(),
  replayBlocked: z.boolean(),
  governanceQuarantine: z.boolean(),
  updatedAt: z.string(),
  updatedByUserId: z.string(),
});

export const RuntimeReconcileEnqueueResponseSchema = z.object({
  ok: z.literal(true),
  enqueued: z.boolean(),
  jobId: z.string().optional(),
});

export const ArtifactSignedTokenResponseSchema = z.object({
  ok: z.literal(true),
  token: z.string(),
  expiresAtIso: z.string(),
  downloadPath: z.string(),
});

export const RuntimeConsistencyPersistAckBodySchema = z.object({
  issueCode: z.string().min(1).max(256),
});

export const RuntimeConsistencyPersistAckResponseSchema = z.object({
  ok: z.literal(true),
  incidentKey: z.string(),
  acknowledgedAt: z.string(),
});

export type RuntimeArtifactPreviewTokenPayload = z.infer<typeof RuntimeArtifactPreviewTokenSchema>;
export type RuntimeIncidentAckPayload = z.infer<typeof RuntimeIncidentAckBodySchema>;
export type RuntimeConsistencyPersistAckPayload = z.infer<typeof RuntimeConsistencyPersistAckBodySchema>;
export type RuntimeBookmarkUpsertPayload = z.infer<typeof RuntimeBookmarkUpsertBodySchema>;
export type RuntimeExecutionNoteCreatePayload = z.infer<typeof RuntimeExecutionNoteCreateBodySchema>;
export type ExecutionOperationalMarkPayload = z.infer<typeof ExecutionOperationalMarkBodySchema>;
