import { z } from "zod";
import { createPaginatedSchema, PaginationQuerySchema } from "./pagination.js";

export const ProjectKindSchema = z.enum(["assistant", "media", "site"]);
export type ProjectKind = z.infer<typeof ProjectKindSchema>;

export const ProjectStatusSchema = z.enum(["draft", "preparing", "ready", "paused"]);
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

/** Loose stats bag — mirrors frontend `ProjectStats` without over-constraining JSON. */
export const ProjectStatsSchema = z.record(z.string(), z.unknown()).optional();

export const ProjectDtoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  kind: ProjectKindSchema,
  name: z.string(),
  status: ProjectStatusSchema,
  briefData: z.record(z.string(), z.unknown()),
  stats: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  readyAt: z.string().optional(),
});

export type ProjectDto = z.infer<typeof ProjectDtoSchema>;

export const ProjectsListResponseSchema = createPaginatedSchema(ProjectDtoSchema);
export type ProjectsListResponse = z.infer<typeof ProjectsListResponseSchema>;

export const CreateProjectBodySchema = z.object({
  kind: ProjectKindSchema,
  briefData: z.record(z.string(), z.unknown()),
});

export type CreateProjectBody = z.infer<typeof CreateProjectBodySchema>;

export const PatchProjectBodySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    status: ProjectStatusSchema.optional(),
    briefData: z.record(z.string(), z.unknown()).optional(),
    stats: z.record(z.string(), z.unknown()).nullable().optional(),
    readyAt: z.union([z.string().datetime(), z.null()]).optional(),
  })
  .strict();

export type PatchProjectBody = z.infer<typeof PatchProjectBodySchema>;

export const ProjectArchiveResponseSchema = z.object({
  ok: z.literal(true),
});

export type ProjectArchiveResponse = z.infer<typeof ProjectArchiveResponseSchema>;

export const ProjectsListQuerySchema = PaginationQuerySchema;
export type ProjectsListQuery = z.infer<typeof ProjectsListQuerySchema>;
