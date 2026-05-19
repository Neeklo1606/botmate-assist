import { Prisma } from "@prisma/client";
import type {
  AppendChatMessageBody,
  ChatMessagesListQuery,
  ChatSessionsListQuery,
  PatchChatSessionBody,
  CreateChatSessionBody,
} from "@botmate/shared";
import type { AuthContext } from "../auth.js";
import {
  archiveChatSessionRow,
  assertAssistantActiveForTenant,
  countChatSessionsActive,
  countMessagesForSession,
  createChatSessionRow,
  findChatSessionActiveForTenant,
  findChatSessionForTenant,
  insertMessageRow,
  listChatSessionsActive,
  listMessagesForSession,
  updateChatSessionRow,
} from "./chat-repository.js";
import {
  buildInitialChatUi,
  chatMessageDtoFromRow,
  chatSessionSummaryDtoFromRow,
  mergeChatSessionMetadata,
} from "./chat-mapper.js";
import { emitMessageCreated, emitSessionUpdated } from "../realtime/workspace-events.js";

export async function listWorkspaceSessions(auth: AuthContext, query: ChatSessionsListQuery) {
  const total = await countChatSessionsActive(auth.tenantId);
  const skip = (query.page - 1) * query.pageSize;
  const rows = await listChatSessionsActive(auth.tenantId, { skip, take: query.pageSize });
  const totalPages = total === 0 ? 0 : Math.ceil(total / query.pageSize);
  return {
    items: rows.map(chatSessionSummaryDtoFromRow),
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages,
    },
  };
}

export async function createWorkspaceChatSession(auth: AuthContext, body: CreateChatSessionBody) {
  let assistantId: string | null = null;
  if (body.assistantId?.trim()) {
    const ok = await assertAssistantActiveForTenant(auth.tenantId, body.assistantId.trim());
    if (!ok) throw new Error("ASSISTANT_NOT_FOUND");
    assistantId = body.assistantId.trim();
  }

  const metaSeed = buildInitialChatUi({
    lane: body.lane,
    visitorName: body.visitorName,
    extras: {},
  });
  const mergedMeta = mergeChatSessionMetadata(metaSeed, body.metadata ?? {}) as Record<string, unknown>;

  const row = await createChatSessionRow({
    tenantId: auth.tenantId,
    userId: auth.userId,
    assistantId,
    channelId: body.channelId?.trim() ?? null,
    visitorKey: body.visitorKey?.trim() ?? null,
    title: body.title?.trim() ?? null,
    metadata: mergedMeta as Prisma.InputJsonValue,
    status: "ACTIVE",
  });

  const sysRow = await insertMessageRow({
    tenantId: auth.tenantId,
    sessionId: row.id,
    role: "SYSTEM",
    content: "Сессия начата",
    metadata: {
      chat: { bubble: "system", laneTransition: false },
    } as Prisma.InputJsonValue,
  });

  emitSessionUpdated(auth.tenantId, row.id, { reason: "created" });
  emitMessageCreated(auth.tenantId, row.id, sysRow.id);

  return chatSessionSummaryDtoFromRow(row);
}

export async function patchWorkspaceChatSession(
  auth: AuthContext,
  sessionId: string,
  body: PatchChatSessionBody,
) {
  const session = await findChatSessionActiveForTenant(sessionId, auth.tenantId);
  if (!session) return null;

  let mergedMeta = mergeChatSessionMetadata(session.metadata ?? {}, body.metadataPatch ?? {});
  const uiDelta: Record<string, unknown> = {};
  if (body.lane !== undefined) uiDelta.lane = body.lane;
  if (body.visitorName !== undefined) uiDelta.visitorName = body.visitorName;
  if (body.unread !== undefined) uiDelta.unread = body.unread;
  if (Object.keys(uiDelta).length > 0) {
    mergedMeta = mergeChatSessionMetadata(mergedMeta, { chatUi: uiDelta });
  }

  let status = session.status;
  if (body.workspaceStatus !== undefined) {
    status = body.workspaceStatus;
  } else if (body.lane === "closed") {
    status = "CLOSED";
  }

  const prismaPatch: Parameters<typeof updateChatSessionRow>[2] = {
    metadata: mergedMeta as Prisma.InputJsonValue,
    status,
  };
  if (body.title !== undefined) prismaPatch.title = body.title;

  const row = await updateChatSessionRow(sessionId, auth.tenantId, prismaPatch);
  if (row) emitSessionUpdated(auth.tenantId, sessionId, { reason: "patched" });
  return row ? chatSessionSummaryDtoFromRow(row) : null;
}

export async function archiveWorkspaceChatSession(auth: AuthContext, sessionId: string) {
  const ok = await archiveChatSessionRow(sessionId, auth.tenantId);
  if (ok) emitSessionUpdated(auth.tenantId, sessionId, { archived: true });
  return ok;
}

export async function listWorkspaceMessages(
  auth: AuthContext,
  sessionId: string,
  query: ChatMessagesListQuery,
) {
  const session = await findChatSessionForTenant(sessionId, auth.tenantId);
  if (!session) return null;

  const total = await countMessagesForSession(sessionId, auth.tenantId);
  const skip = (query.page - 1) * query.pageSize;
  const rows = await listMessagesForSession(sessionId, auth.tenantId, { skip, take: query.pageSize });
  const totalPages = total === 0 ? 0 : Math.ceil(total / query.pageSize);

  return {
    items: rows.map(chatMessageDtoFromRow),
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages,
    },
  };
}

export async function appendPersistOnlyMessage(
  auth: AuthContext,
  sessionId: string,
  body: AppendChatMessageBody,
) {
  const session = await findChatSessionActiveForTenant(sessionId, auth.tenantId);
  if (!session) return null;

  const bubbleWho = body.bubbleWho!;
  let role: "USER" | "ASSISTANT" | "SYSTEM";
  const metaChat: Record<string, unknown> = {};
  if (body.authorName) metaChat.authorName = body.authorName;
  if (body.metadata && typeof body.metadata === "object") {
    Object.assign(metaChat, body.metadata);
  }

  if (bubbleWho === "visitor") {
    role = "USER";
    metaChat.bubble = "visitor";
  } else if (bubbleWho === "ai") {
    role = "ASSISTANT";
    metaChat.bubble = "ai";
  } else if (bubbleWho === "operator") {
    role = "SYSTEM";
    metaChat.bubble = "operator";
  } else {
    role = "SYSTEM";
    metaChat.bubble = "system";
  }

  const row = await insertMessageRow({
    tenantId: auth.tenantId,
    sessionId,
    role,
    content: body.content.trim(),
    metadata: { chat: metaChat } as Prisma.InputJsonValue,
  });

  emitMessageCreated(auth.tenantId, sessionId, row.id);

  return chatMessageDtoFromRow(row);
}

export async function ensureWorkspaceChatSession(auth: AuthContext, sessionId: string) {
  return findChatSessionActiveForTenant(sessionId, auth.tenantId);
}
