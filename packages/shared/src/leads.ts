import { z } from "zod";
import { createPaginatedSchema, PaginationQuerySchema } from "./pagination.js";

/** CRM Kanban column — aligns with `_app.leads` UI. */
export const LeadPipelineStatusSchema = z.enum(["new", "working", "meeting", "closed", "rejected"]);
export type LeadPipelineStatus = z.infer<typeof LeadPipelineStatusSchema>;

export const LeadSourceKindSchema = z.enum(["chat", "call", "form", "tool", "other"]);
export type LeadSourceKind = z.infer<typeof LeadSourceKindSchema>;

export const LEAD_NAME_MAX = 120;
export const LEAD_CONTACT_MAX = 200;
export const LEAD_INTEREST_MAX = 500;
export const LEAD_SUMMARY_MAX = 4000;

export const LeadsListQuerySchema = PaginationQuerySchema.extend({
  pipelineStatus: LeadPipelineStatusSchema.optional(),
  source: LeadSourceKindSchema.optional(),
  search: z.string().max(200).optional(),
});
export type LeadsListQuery = z.infer<typeof LeadsListQuerySchema>;

const TimelineEventSchema = z.object({
  id: z.string(),
  kind: z.enum(["ai", "visitor", "operator", "call", "system"]),
  text: z.string(),
  at: z.string(),
});

const TaskSchema = z.object({
  id: z.string(),
  text: z.string(),
  due: z.string(),
  done: z.boolean(),
});

export const LeadCrmMetadataSchema = z
  .object({
    tags: z.array(z.string()).optional(),
    timeline: z.array(TimelineEventSchema).optional(),
    tasks: z.array(TaskSchema).optional(),
    notes: z.string().max(LEAD_SUMMARY_MAX).optional(),
    managerName: z.string().max(120).optional(),
    managerAvatar: z.string().max(8).optional(),
  })
  .strict()
  .optional();

export type LeadCrmMetadata = z.infer<typeof LeadCrmMetadataSchema>;

export const LeadDtoSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  assistantId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  sessionId: z.string().nullable().optional(),
  ownerUserId: z.string().nullable().optional(),
  ownerName: z.string().optional(),
  name: z.string(),
  contact: z.string(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  summary: z.string(),
  interest: z.string(),
  source: LeadSourceKindSchema,
  pipelineStatus: LeadPipelineStatusSchema,
  displayNumber: z.number().int().nonnegative(),
  attribution: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type LeadDto = z.infer<typeof LeadDtoSchema>;

export const LeadsListResponseSchema = createPaginatedSchema(LeadDtoSchema);
export type LeadsListResponse = z.infer<typeof LeadsListResponseSchema>;

export const CreateLeadBodySchema = z
  .object({
    name: z.string().min(1).max(LEAD_NAME_MAX),
    contact: z.string().min(1).max(LEAD_CONTACT_MAX),
    phone: z.string().max(40).optional(),
    email: z.string().email().optional(),
    summary: z.string().max(LEAD_SUMMARY_MAX).optional(),
    interest: z.string().max(LEAD_INTEREST_MAX).optional(),
    source: LeadSourceKindSchema.optional(),
    pipelineStatus: LeadPipelineStatusSchema.optional(),
    assistantId: z.string().min(1).optional(),
    projectId: z.string().min(1).optional(),
    sessionId: z.string().min(1).optional(),
    ownerUserId: z.string().min(1).optional(),
    attribution: z.record(z.string(), z.unknown()).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export type CreateLeadBody = z.infer<typeof CreateLeadBodySchema>;

export const PatchLeadBodySchema = z
  .object({
    name: z.string().min(1).max(LEAD_NAME_MAX).optional(),
    contact: z.string().min(1).max(LEAD_CONTACT_MAX).optional(),
    phone: z.string().max(40).nullable().optional(),
    email: z.string().email().nullable().optional(),
    summary: z.string().max(LEAD_SUMMARY_MAX).optional(),
    interest: z.string().max(LEAD_INTEREST_MAX).optional(),
    source: LeadSourceKindSchema.optional(),
    pipelineStatus: LeadPipelineStatusSchema.optional(),
    assistantId: z.string().nullable().optional(),
    projectId: z.string().nullable().optional(),
    sessionId: z.string().nullable().optional(),
    ownerUserId: z.string().nullable().optional(),
    attributionPatch: z.record(z.string(), z.unknown()).optional(),
    metadataPatch: z.record(z.string(), z.unknown()).optional(),
    notes: z.string().max(LEAD_SUMMARY_MAX).optional(),
  })
  .strict();

export type PatchLeadBody = z.infer<typeof PatchLeadBodySchema>;

export const LeadArchiveResponseSchema = z.object({
  ok: z.literal(true),
});
