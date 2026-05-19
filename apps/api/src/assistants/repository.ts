import { prisma } from "@botmate/database";
import type { AssistantNiche, AssistantStatus, Prisma } from "@prisma/client";

const assistantSelect = {
  id: true,
  tenantId: true,
  ownerUserId: true,
  projectId: true,
  name: true,
  niche: true,
  status: true,
  settings: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type AssistantRow = Prisma.AssistantGetPayload<{ select: typeof assistantSelect }>;

export async function countActiveAssistantsByTenant(tenantId: string): Promise<number> {
  return prisma.assistant.count({
    where: { tenantId, archivedAt: null },
  });
}

export async function listActiveAssistantsByTenant(
  tenantId: string,
  params: { skip: number; take: number },
): Promise<AssistantRow[]> {
  return prisma.assistant.findMany({
    where: { tenantId, archivedAt: null },
    orderBy: { updatedAt: "desc" },
    skip: params.skip,
    take: params.take,
    select: assistantSelect,
  });
}

export async function findActiveAssistantByIdForTenant(
  id: string,
  tenantId: string,
): Promise<AssistantRow | null> {
  return prisma.assistant.findFirst({
    where: { id, tenantId, archivedAt: null },
    select: assistantSelect,
  });
}

export async function assertProjectBelongsToTenant(
  tenantId: string,
  projectId: string,
): Promise<boolean> {
  const row = await prisma.project.findFirst({
    where: { id: projectId, tenantId, archivedAt: null },
    select: { id: true },
  });
  return !!row;
}

export async function createAssistantRow(input: {
  tenantId: string;
  ownerUserId: string;
  projectId: string | null;
  name: string;
  niche: AssistantNiche;
  status: AssistantStatus;
  settings: Prisma.InputJsonValue;
}): Promise<AssistantRow> {
  return prisma.assistant.create({
    data: {
      tenantId: input.tenantId,
      ownerUserId: input.ownerUserId,
      projectId: input.projectId,
      name: input.name,
      niche: input.niche,
      status: input.status,
      settings: input.settings,
    },
    select: assistantSelect,
  });
}

export async function updateAssistantRow(
  id: string,
  tenantId: string,
  patch: {
    name?: string;
    niche?: AssistantNiche;
    status?: AssistantStatus;
    projectId?: string | null;
    settings?: Prisma.InputJsonValue;
  },
): Promise<AssistantRow | null> {
  const existing = await prisma.assistant.findFirst({
    where: { id, tenantId, archivedAt: null },
    select: { id: true },
  });
  if (!existing) return null;

  return prisma.assistant.update({
    where: { id },
    data: {
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.niche !== undefined ? { niche: patch.niche } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.projectId !== undefined ? { projectId: patch.projectId } : {}),
      ...(patch.settings !== undefined ? { settings: patch.settings } : {}),
    },
    select: assistantSelect,
  });
}

export async function archiveAssistantRow(id: string, tenantId: string): Promise<boolean> {
  const existing = await prisma.assistant.findFirst({
    where: { id, tenantId, archivedAt: null },
    select: { id: true },
  });
  if (!existing) return false;

  await prisma.assistant.update({
    where: { id },
    data: { archivedAt: new Date() },
  });
  return true;
}
