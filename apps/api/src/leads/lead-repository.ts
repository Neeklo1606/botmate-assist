import { prisma } from "@botmate/database";
import { Prisma, type LeadPipelineStatus, type LeadSourceKind } from "@prisma/client";

export const leadRowSelect = {
  id: true,
  tenantId: true,
  assistantId: true,
  projectId: true,
  sessionId: true,
  ownerUserId: true,
  name: true,
  contact: true,
  phone: true,
  email: true,
  summary: true,
  interest: true,
  source: true,
  pipelineStatus: true,
  idempotencyKey: true,
  attribution: true,
  metadata: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type LeadRow = Prisma.LeadGetPayload<{ select: typeof leadRowSelect }>;

export async function countLeadsActive(tenantId: string, whereExtra?: Prisma.LeadWhereInput): Promise<number> {
  return prisma.lead.count({
    where: { tenantId, archivedAt: null, ...whereExtra },
  });
}

export async function listLeadsActive(
  tenantId: string,
  params: { skip: number; take: number; whereExtra?: Prisma.LeadWhereInput },
): Promise<LeadRow[]> {
  return prisma.lead.findMany({
    where: { tenantId, archivedAt: null, ...params.whereExtra },
    orderBy: { createdAt: "desc" },
    skip: params.skip,
    take: params.take,
    select: leadRowSelect,
  });
}

export async function findLeadActiveForTenant(
  leadId: string,
  tenantId: string,
): Promise<LeadRow | null> {
  return prisma.lead.findFirst({
    where: { id: leadId, tenantId, archivedAt: null },
    select: leadRowSelect,
  });
}

export async function findLeadByIdempotencyKey(
  tenantId: string,
  idempotencyKey: string,
): Promise<LeadRow | null> {
  return prisma.lead.findFirst({
    where: { tenantId, idempotencyKey },
    select: leadRowSelect,
  });
}

export async function insertLeadRow(input: {
  tenantId: string;
  assistantId?: string | null;
  projectId?: string | null;
  sessionId?: string | null;
  ownerUserId?: string | null;
  name: string;
  contact: string;
  phone?: string | null;
  email?: string | null;
  summary: string;
  interest: string;
  source: LeadSourceKind;
  pipelineStatus: LeadPipelineStatus;
  idempotencyKey?: string | null;
  attribution?: Prisma.InputJsonValue | typeof Prisma.JsonNull;
  metadata?: Prisma.InputJsonValue | typeof Prisma.JsonNull;
}): Promise<LeadRow> {
  return prisma.lead.create({
    data: {
      tenantId: input.tenantId,
      assistantId: input.assistantId ?? undefined,
      projectId: input.projectId ?? undefined,
      sessionId: input.sessionId ?? undefined,
      ownerUserId: input.ownerUserId ?? undefined,
      name: input.name,
      contact: input.contact,
      phone: input.phone ?? undefined,
      email: input.email ?? undefined,
      summary: input.summary,
      interest: input.interest,
      source: input.source,
      pipelineStatus: input.pipelineStatus,
      idempotencyKey: input.idempotencyKey ?? undefined,
      attribution: input.attribution ?? Prisma.JsonNull,
      metadata: input.metadata ?? Prisma.JsonNull,
    },
    select: leadRowSelect,
  });
}

export async function updateLeadRow(
  leadId: string,
  tenantId: string,
  patch: {
    name?: string;
    contact?: string;
    phone?: string | null;
    email?: string | null;
    summary?: string;
    interest?: string;
    source?: LeadSourceKind;
    pipelineStatus?: LeadPipelineStatus;
    assistantId?: string | null;
    projectId?: string | null;
    sessionId?: string | null;
    ownerUserId?: string | null;
    attribution?: Prisma.InputJsonValue | typeof Prisma.JsonNull;
    metadata?: Prisma.InputJsonValue | typeof Prisma.JsonNull;
  },
): Promise<LeadRow | null> {
  const exists = await prisma.lead.findFirst({
    where: { id: leadId, tenantId, archivedAt: null },
    select: { id: true },
  });
  if (!exists) return null;

  return prisma.lead.update({
    where: { id: leadId },
    data: {
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.contact !== undefined ? { contact: patch.contact } : {}),
      ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
      ...(patch.email !== undefined ? { email: patch.email } : {}),
      ...(patch.summary !== undefined ? { summary: patch.summary } : {}),
      ...(patch.interest !== undefined ? { interest: patch.interest } : {}),
      ...(patch.source !== undefined ? { source: patch.source } : {}),
      ...(patch.pipelineStatus !== undefined ? { pipelineStatus: patch.pipelineStatus } : {}),
      ...(patch.assistantId !== undefined ? { assistantId: patch.assistantId } : {}),
      ...(patch.projectId !== undefined ? { projectId: patch.projectId } : {}),
      ...(patch.sessionId !== undefined ? { sessionId: patch.sessionId } : {}),
      ...(patch.ownerUserId !== undefined ? { ownerUserId: patch.ownerUserId } : {}),
      ...(patch.attribution !== undefined ? { attribution: patch.attribution } : {}),
      ...(patch.metadata !== undefined ? { metadata: patch.metadata } : {}),
    },
    select: leadRowSelect,
  });
}

export async function archiveLeadRow(leadId: string, tenantId: string): Promise<boolean> {
  const exists = await prisma.lead.findFirst({
    where: { id: leadId, tenantId, archivedAt: null },
    select: { id: true },
  });
  if (!exists) return false;

  await prisma.lead.update({
    where: { id: leadId },
    data: { archivedAt: new Date() },
  });
  return true;
}

export async function assertProjectActiveForTenant(tenantId: string, projectId: string): Promise<boolean> {
  const row = await prisma.project.findFirst({
    where: { id: projectId, tenantId, archivedAt: null },
    select: { id: true },
  });
  return !!row;
}

export async function assertChatSessionForTenant(tenantId: string, sessionId: string): Promise<boolean> {
  const row = await prisma.chatSession.findFirst({
    where: { id: sessionId, tenantId },
    select: { id: true },
  });
  return !!row;
}

export async function assertUserBelongsToTenant(tenantId: string, userId: string): Promise<boolean> {
  const row = await prisma.user.findFirst({
    where: { id: userId, tenantId },
    select: { id: true },
  });
  return !!row;
}

export async function findUserFullName(tenantId: string, userId: string): Promise<string | null> {
  const row = await prisma.user.findFirst({
    where: { id: userId, tenantId },
    select: { fullName: true },
  });
  return row?.fullName ?? null;
}
