import { prisma } from "@botmate/database";
import type { Prisma, ProjectKind, ProjectStatus } from "@prisma/client";

const projectSelect = {
  id: true,
  tenantId: true,
  ownerUserId: true,
  kind: true,
  name: true,
  status: true,
  briefData: true,
  stats: true,
  readyAt: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type ProjectRow = Prisma.ProjectGetPayload<{ select: typeof projectSelect }>;

export async function countActiveByTenant(tenantId: string): Promise<number> {
  return prisma.project.count({
    where: { tenantId, archivedAt: null },
  });
}

export async function listActiveByTenant(
  tenantId: string,
  params: { skip: number; take: number },
): Promise<ProjectRow[]> {
  return prisma.project.findMany({
    where: { tenantId, archivedAt: null },
    orderBy: { updatedAt: "desc" },
    skip: params.skip,
    take: params.take,
    select: projectSelect,
  });
}

export async function findActiveByIdForTenant(
  id: string,
  tenantId: string,
): Promise<ProjectRow | null> {
  return prisma.project.findFirst({
    where: { id, tenantId, archivedAt: null },
    select: projectSelect,
  });
}

export async function createProjectRow(input: {
  tenantId: string;
  ownerUserId: string;
  kind: ProjectKind;
  name: string;
  status: ProjectStatus;
  briefData: Prisma.InputJsonValue;
}): Promise<ProjectRow> {
  return prisma.project.create({
    data: {
      tenantId: input.tenantId,
      ownerUserId: input.ownerUserId,
      kind: input.kind,
      name: input.name,
      status: input.status,
      briefData: input.briefData,
    },
    select: projectSelect,
  });
}

export async function updateProjectRow(
  id: string,
  tenantId: string,
  patch: {
    name?: string;
    status?: ProjectStatus;
    briefData?: Prisma.InputJsonValue;
    stats?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
    readyAt?: Date | null;
  },
): Promise<ProjectRow | null> {
  const existing = await prisma.project.findFirst({
    where: { id, tenantId, archivedAt: null },
    select: { id: true },
  });
  if (!existing) return null;

  return prisma.project.update({
    where: { id },
    data: {
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.briefData !== undefined ? { briefData: patch.briefData } : {}),
      ...(patch.stats !== undefined ? { stats: patch.stats } : {}),
      ...(patch.readyAt !== undefined ? { readyAt: patch.readyAt } : {}),
    },
    select: projectSelect,
  });
}

export async function archiveProjectRow(id: string, tenantId: string): Promise<boolean> {
  const existing = await prisma.project.findFirst({
    where: { id, tenantId, archivedAt: null },
    select: { id: true },
  });
  if (!existing) return false;

  await prisma.project.update({
    where: { id },
    data: { archivedAt: new Date() },
  });
  return true;
}
