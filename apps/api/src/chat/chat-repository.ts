import { prisma } from "@botmate/database";
import { Prisma, type MessageDeliveryStatus, type MessageRole, type SessionStatus } from "@prisma/client";

export const chatSessionSelect = {
  id: true,
  tenantId: true,
  userId: true,
  assistantId: true,
  channelId: true,
  visitorKey: true,
  title: true,
  metadata: true,
  status: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type ChatSessionRow = Prisma.ChatSessionGetPayload<{ select: typeof chatSessionSelect }>;

export const chatMessageSelect = {
  id: true,
  tenantId: true,
  sessionId: true,
  role: true,
  content: true,
  metadata: true,
  deliveryStatus: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type ChatMessageRow = Prisma.MessageGetPayload<{ select: typeof chatMessageSelect }>;

export async function countChatSessionsActive(tenantId: string): Promise<number> {
  return prisma.chatSession.count({
    where: { tenantId, archivedAt: null },
  });
}

export async function listChatSessionsActive(
  tenantId: string,
  params: { skip: number; take: number },
): Promise<ChatSessionRow[]> {
  return prisma.chatSession.findMany({
    where: { tenantId, archivedAt: null },
    orderBy: { updatedAt: "desc" },
    skip: params.skip,
    take: params.take,
    select: chatSessionSelect,
  });
}

export async function findChatSessionActiveForTenant(
  sessionId: string,
  tenantId: string,
): Promise<ChatSessionRow | null> {
  return prisma.chatSession.findFirst({
    where: { id: sessionId, tenantId, archivedAt: null },
    select: chatSessionSelect,
  });
}

/** Readable transcript even when session is archived (tenant-scoped). */
export async function findChatSessionForTenant(
  sessionId: string,
  tenantId: string,
): Promise<ChatSessionRow | null> {
  return prisma.chatSession.findFirst({
    where: { id: sessionId, tenantId },
    select: chatSessionSelect,
  });
}

export async function createChatSessionRow(input: {
  tenantId: string;
  userId: string | null;
  assistantId: string | null;
  channelId: string | null;
  visitorKey: string | null;
  title: string | null;
  metadata: Prisma.InputJsonValue;
  status: SessionStatus;
}): Promise<ChatSessionRow> {
  return prisma.chatSession.create({
    data: {
      tenantId: input.tenantId,
      userId: input.userId,
      assistantId: input.assistantId,
      channelId: input.channelId,
      visitorKey: input.visitorKey,
      title: input.title,
      metadata: input.metadata,
      status: input.status,
    },
    select: chatSessionSelect,
  });
}

export async function updateChatSessionRow(
  sessionId: string,
  tenantId: string,
  patch: {
    title?: string | null;
    metadata?: Prisma.InputJsonValue;
    status?: SessionStatus;
    archivedAt?: Date | null;
  },
): Promise<ChatSessionRow | null> {
  const exists = await prisma.chatSession.findFirst({
    where: { id: sessionId, tenantId, archivedAt: null },
    select: { id: true },
  });
  if (!exists) return null;

  return prisma.chatSession.update({
    where: { id: sessionId },
    data: {
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.metadata !== undefined ? { metadata: patch.metadata } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.archivedAt !== undefined ? { archivedAt: patch.archivedAt } : {}),
    },
    select: chatSessionSelect,
  });
}

export async function archiveChatSessionRow(sessionId: string, tenantId: string): Promise<boolean> {
  const exists = await prisma.chatSession.findFirst({
    where: { id: sessionId, tenantId, archivedAt: null },
    select: { id: true },
  });
  if (!exists) return false;

  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { archivedAt: new Date(), status: "CLOSED" },
  });
  return true;
}

export async function assertAssistantActiveForTenant(
  tenantId: string,
  assistantId: string,
): Promise<boolean> {
  const row = await prisma.assistant.findFirst({
    where: { id: assistantId, tenantId, archivedAt: null },
    select: { id: true },
  });
  return !!row;
}

export async function countMessagesForSession(sessionId: string, tenantId: string): Promise<number> {
  return prisma.message.count({
    where: { sessionId, tenantId },
  });
}

export async function listMessagesForSession(
  sessionId: string,
  tenantId: string,
  params: { skip: number; take: number },
): Promise<ChatMessageRow[]> {
  return prisma.message.findMany({
    where: { sessionId, tenantId },
    orderBy: { createdAt: "asc" },
    skip: params.skip,
    take: params.take,
    select: chatMessageSelect,
  });
}

export async function insertMessageRow(input: {
  tenantId: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  metadata?: Prisma.InputJsonValue | typeof Prisma.JsonNull;
  deliveryStatus?: MessageDeliveryStatus;
}): Promise<ChatMessageRow> {
  return prisma.message.create({
    data: {
      tenantId: input.tenantId,
      sessionId: input.sessionId,
      role: input.role,
      content: input.content,
      metadata: input.metadata ?? Prisma.JsonNull,
      deliveryStatus: input.deliveryStatus ?? "complete",
    },
    select: chatMessageSelect,
  });
}
