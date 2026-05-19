import { Prisma } from "@prisma/client";
import type { PatchProjectBody } from "@botmate/shared";
import { ProjectDtoSchema, type CreateProjectBody, type ProjectDto } from "@botmate/shared";
import type { AuthContext } from "../auth.js";
import { buildProjectName } from "./build-name.js";
import {
  archiveProjectRow,
  countActiveByTenant,
  createProjectRow,
  findActiveByIdForTenant,
  listActiveByTenant,
  updateProjectRow,
  type ProjectRow,
} from "./repository.js";

function rowToDto(row: ProjectRow): ProjectDto {
  const brief =
    typeof row.briefData === "object" && row.briefData !== null && !Array.isArray(row.briefData)
      ? (row.briefData as Record<string, unknown>)
      : {};
  let stats: Record<string, unknown> | undefined;
  if (row.stats != null && typeof row.stats === "object" && !Array.isArray(row.stats)) {
    stats = row.stats as Record<string, unknown>;
  }

  return ProjectDtoSchema.parse({
    id: row.id,
    userId: row.ownerUserId,
    kind: row.kind,
    name: row.name,
    status: row.status,
    briefData: brief,
    stats,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    readyAt: row.readyAt?.toISOString(),
  });
}

export { requireWorkspaceAuth } from "../workspace-auth.js";

export async function listProjectsService(
  auth: AuthContext,
  params: { page: number; pageSize: number },
): Promise<{ items: ProjectDto[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }> {
  const total = await countActiveByTenant(auth.tenantId);
  const skip = (params.page - 1) * params.pageSize;
  const rows = await listActiveByTenant(auth.tenantId, { skip, take: params.pageSize });
  const totalPages = total === 0 ? 0 : Math.ceil(total / params.pageSize);
  return {
    items: rows.map(rowToDto),
    meta: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages,
    },
  };
}

export async function createProjectService(auth: AuthContext, body: CreateProjectBody): Promise<ProjectDto> {
  const name = buildProjectName(body.kind, body.briefData);
  const row = await createProjectRow({
    tenantId: auth.tenantId,
    ownerUserId: auth.userId,
    kind: body.kind,
    name,
    status: "preparing",
    briefData: body.briefData as Prisma.InputJsonValue,
  });
  return rowToDto(row);
}

export async function getProjectService(auth: AuthContext, id: string): Promise<ProjectDto | null> {
  const row = await findActiveByIdForTenant(id, auth.tenantId);
  return row ? rowToDto(row) : null;
}

export async function patchProjectService(
  auth: AuthContext,
  id: string,
  body: PatchProjectBody,
): Promise<ProjectDto | null> {
  const patch: Parameters<typeof updateProjectRow>[2] = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.status !== undefined) patch.status = body.status;
  if (body.briefData !== undefined) patch.briefData = body.briefData as Prisma.InputJsonValue;
  if (body.stats !== undefined) {
    patch.stats =
      body.stats === null ? Prisma.JsonNull : (body.stats as Prisma.InputJsonValue);
  }
  if (body.readyAt !== undefined) {
    patch.readyAt = body.readyAt === null ? null : new Date(body.readyAt);
  }
  const row = await updateProjectRow(id, auth.tenantId, patch);
  return row ? rowToDto(row) : null;
}

export async function archiveProjectService(auth: AuthContext, id: string): Promise<boolean> {
  return archiveProjectRow(id, auth.tenantId);
}
