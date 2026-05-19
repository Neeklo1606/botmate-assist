import type { ChatBubbleWho, ChatLane, ChatSessionSummaryDto, ChatMessageDto } from "@botmate/shared";
import type { ChatMessageRow, ChatSessionRow } from "./chat-repository.js";

function asObj(raw: unknown): Record<string, unknown> {
  if (raw !== null && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

export interface ChatUiShape {
  lane?: ChatLane;
  displayNumber?: number;
  visitorName?: string | null;
  unread?: number;
  deviceType?: "mobile" | "desktop" | "tablet";
  deviceLabel?: string;
  city?: string;
  flag?: string;
  source?: string;
  path?: Array<{ title: string; seconds: number }>;
}

export function parseChatUi(metadata: unknown): ChatUiShape {
  const root = asObj(metadata);
  const ui = asObj(root.chatUi);
  const unread =
    typeof ui.unread === "number" && Number.isFinite(ui.unread) ? Math.max(0, Math.floor(ui.unread)) : undefined;
  const displayNumber =
    typeof ui.displayNumber === "number" && Number.isFinite(ui.displayNumber)
      ? Math.max(0, Math.floor(ui.displayNumber))
      : undefined;
  const laneParsed =
    ui.lane === "ai" || ui.lane === "operator" || ui.lane === "closed" ? ui.lane : undefined;
  const deviceTypeParsed =
    ui.deviceType === "mobile" || ui.deviceType === "desktop" || ui.deviceType === "tablet"
      ? ui.deviceType
      : undefined;
  let path: ChatUiShape["path"];
  if (Array.isArray(ui.path)) {
    path = [];
    for (const p of ui.path) {
      const o = asObj(p);
      const title = typeof o.title === "string" ? o.title : "";
      const seconds =
        typeof o.seconds === "number" && Number.isFinite(o.seconds) ? Math.max(0, o.seconds) : 0;
      path.push({ title, seconds });
    }
  }
  return {
    lane: laneParsed,
    displayNumber,
    visitorName: typeof ui.visitorName === "string" ? ui.visitorName : ui.visitorName === null ? null : undefined,
    unread,
    deviceType: deviceTypeParsed,
    deviceLabel: typeof ui.deviceLabel === "string" ? ui.deviceLabel : undefined,
    city: typeof ui.city === "string" ? ui.city : undefined,
    flag: typeof ui.flag === "string" ? ui.flag : undefined,
    source: typeof ui.source === "string" ? ui.source : undefined,
    path,
  };
}

export function fallbackDisplayNumber(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return 10000 + (h % 90000);
}

export function deriveLane(row: ChatSessionRow, ui: ChatUiShape): ChatLane {
  if (ui.lane) return ui.lane;
  if (row.status === "CLOSED") return "closed";
  return "ai";
}

export function chatSessionSummaryDtoFromRow(row: ChatSessionRow): ChatSessionSummaryDto {
  const ui = parseChatUi(row.metadata);
  const lane = deriveLane(row, ui);
  const displayNumber = ui.displayNumber ?? fallbackDisplayNumber(row.id);

  return {
    id: row.id,
    tenantId: row.tenantId,
    userId: row.userId ?? undefined,
    assistantId: row.assistantId ?? undefined,
    channelId: row.channelId ?? undefined,
    visitorKey: row.visitorKey ?? undefined,
    title: row.title ?? undefined,
    workspaceStatus: row.status,
    lane,
    displayNumber,
    visitorName: ui.visitorName ?? undefined,
    unread: ui.unread ?? 0,
    deviceType: ui.deviceType,
    deviceLabel: ui.deviceLabel,
    city: ui.city,
    flag: ui.flag,
    source: ui.source,
    path: ui.path,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function bubbleWhoFromRow(row: ChatMessageRow): ChatBubbleWho {
  const meta = asObj(row.metadata);
  const chat = asObj(meta.chat);
  const bubble = chat.bubble;
  if (bubble === "visitor" || bubble === "ai" || bubble === "operator" || bubble === "system") {
    return bubble;
  }
  if (row.role === "USER") return "visitor";
  if (row.role === "ASSISTANT") return "ai";
  return "system";
}

export function authorNameFromRow(row: ChatMessageRow): string | undefined {
  const meta = asObj(row.metadata);
  const chat = asObj(meta.chat);
  return typeof chat.authorName === "string" ? chat.authorName : undefined;
}

export function chatMessageDtoFromRow(row: ChatMessageRow): ChatMessageDto {
  const meta =
    row.metadata != null && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : undefined;
  return {
    id: row.id,
    sessionId: row.sessionId,
    tenantId: row.tenantId,
    role: row.role,
    content: row.content,
    deliveryStatus: row.deliveryStatus,
    bubbleWho: bubbleWhoFromRow(row),
    authorName: authorNameFromRow(row),
    metadata: meta,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function buildInitialChatUi(input: {
  lane?: ChatLane;
  visitorName?: string | null;
  displayNumber?: number;
  extras?: Record<string, unknown>;
}): Record<string, unknown> {
  const lane = input.lane ?? "ai";
  const displayNumber =
    typeof input.displayNumber === "number"
      ? input.displayNumber
      : Math.floor(10000 + Math.random() * 90000);
  return {
    chatUi: {
      lane,
      displayNumber,
      visitorName: input.visitorName ?? null,
      unread: 0,
      deviceType: "desktop",
      deviceLabel: "Web",
      city: "—",
      flag: "🌐",
      source: "direct",
      path: [],
      ...(input.extras ?? {}),
    },
  };
}

export function mergeChatSessionMetadata(prev: unknown, patch: Record<string, unknown>): Record<string, unknown> {
  const baseRoot = asObj(prev);
  const baseUi = asObj(baseRoot.chatUi);
  const patchUi = asObj(patch.chatUi);
  const mergedUi =
    Object.keys(patchUi).length > 0 ? { ...baseUi, ...patchUi } : baseUi;
  const mergedRoot = { ...baseRoot, ...patch };
  if (Object.keys(patchUi).length > 0 || baseRoot.chatUi) {
    mergedRoot.chatUi = mergedUi;
  }
  return mergedRoot;
}
