import { z } from "zod";

export const KnowledgeBaseDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  assistantId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type KnowledgeBaseDto = z.infer<typeof KnowledgeBaseDtoSchema>;

export const KnowledgeBasesListResponseSchema = z.object({
  items: z.array(KnowledgeBaseDtoSchema),
});

export type KnowledgeBasesListResponse = z.infer<typeof KnowledgeBasesListResponseSchema>;

export const CreateKnowledgeBaseBodySchema = z.object({
  name: z.string().min(1).max(200),
  assistantId: z.string().optional(),
});

export type CreateKnowledgeBaseBody = z.infer<typeof CreateKnowledgeBaseBodySchema>;

export const KnowledgeDocumentStatusSchema = z.enum([
  "pending",
  "processing",
  "ready",
  "error",
]);

export type KnowledgeDocumentStatus = z.infer<typeof KnowledgeDocumentStatusSchema>;

export const KnowledgeDocumentDtoSchema = z.object({
  id: z.string(),
  knowledgeBaseId: z.string(),
  title: z.string(),
  mimeType: z.string(),
  byteSize: z.number().int().nonnegative(),
  status: KnowledgeDocumentStatusSchema,
  errorMessage: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type KnowledgeDocumentDto = z.infer<typeof KnowledgeDocumentDtoSchema>;

export const KnowledgeDocumentsListResponseSchema = z.object({
  items: z.array(KnowledgeDocumentDtoSchema),
});

export type KnowledgeDocumentsListResponse = z.infer<
  typeof KnowledgeDocumentsListResponseSchema
>;

export const KnowledgeDocumentUploadBodySchema = z.object({
  title: z.string().min(1).max(500),
  mimeType: z.string().min(1).max(200),
  contentBase64: z.string().min(1),
});

export type KnowledgeDocumentUploadBody = z.infer<typeof KnowledgeDocumentUploadBodySchema>;

export const KnowledgeDocumentUploadResponseSchema = z.object({
  id: z.string(),
  knowledgeBaseId: z.string(),
  status: KnowledgeDocumentStatusSchema,
  queued: z.boolean(),
});

export type KnowledgeDocumentUploadResponse = z.infer<typeof KnowledgeDocumentUploadResponseSchema>;
