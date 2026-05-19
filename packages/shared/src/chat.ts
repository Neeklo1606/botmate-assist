import { z } from "zod";
import { createPaginatedSchema, PaginationQuerySchema } from "./pagination.js";

/** Operator-facing lane filter — derived from metadata + workspace session status. */
export const ChatLaneSchema = z.enum(["ai", "operator", "closed"]);
export type ChatLane = z.infer<typeof ChatLaneSchema>;

export const WorkspaceSessionStatusSchema = z.enum(["ACTIVE", "CLOSED"]);
export type WorkspaceSessionStatus = z.infer<typeof WorkspaceSessionStatusSchema>;

export const ChatMessageRoleSchema = z.enum(["USER", "ASSISTANT", "SYSTEM", "TOOL"]);
export type ChatMessageRole = z.infer<typeof ChatMessageRoleSchema>;

export const MessageDeliveryStatusSchema = z.enum(["complete", "streaming", "partial", "failed"]);
export type MessageDeliveryStatus = z.infer<typeof MessageDeliveryStatusSchema>;

/** UI bubble mapping — normalized server-side from Message.role + metadata.chat.bubble */
export const ChatBubbleWhoSchema = z.enum(["visitor", "ai", "operator", "system"]);
export type ChatBubbleWho = z.infer<typeof ChatBubbleWhoSchema>;

export const CHAT_MESSAGE_MAX_LENGTH = 4000;

export const ChatSessionsListQuerySchema = PaginationQuerySchema;
export type ChatSessionsListQuery = z.infer<typeof ChatSessionsListQuerySchema>;

export const ChatMessagesListQuerySchema = PaginationQuerySchema;
export type ChatMessagesListQuery = z.infer<typeof ChatMessagesListQuerySchema>;

export const ChatSessionSummaryDtoSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  userId: z.string().nullable().optional(),
  assistantId: z.string().nullable().optional(),
  channelId: z.string().nullable().optional(),
  visitorKey: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  workspaceStatus: WorkspaceSessionStatusSchema,
  lane: ChatLaneSchema,
  displayNumber: z.number().int().nonnegative(),
  visitorName: z.string().nullable().optional(),
  unread: z.number().int().nonnegative(),
  deviceType: z.enum(["mobile", "desktop", "tablet"]).optional(),
  deviceLabel: z.string().optional(),
  city: z.string().optional(),
  flag: z.string().optional(),
  source: z.string().optional(),
  path: z
    .array(
      z.object({
        title: z.string(),
        seconds: z.number().nonnegative(),
      }),
    )
    .optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ChatSessionSummaryDto = z.infer<typeof ChatSessionSummaryDtoSchema>;

export const ChatSessionsListResponseSchema = createPaginatedSchema(ChatSessionSummaryDtoSchema);

export type ChatSessionsListResponse = z.infer<typeof ChatSessionsListResponseSchema>;

export const ChatMessageDtoSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  tenantId: z.string(),
  role: ChatMessageRoleSchema,
  content: z.string(),
  deliveryStatus: MessageDeliveryStatusSchema,
  bubbleWho: ChatBubbleWhoSchema,
  authorName: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ChatMessageDto = z.infer<typeof ChatMessageDtoSchema>;

export const ChatMessagesListResponseSchema = createPaginatedSchema(ChatMessageDtoSchema);

export type ChatMessagesListResponse = z.infer<typeof ChatMessagesListResponseSchema>;

export const CreateChatSessionBodySchema = z
  .object({
    title: z.string().max(200).optional(),
    assistantId: z.string().min(1).optional(),
    channelId: z.string().max(64).optional(),
    visitorKey: z.string().max(128).optional(),
    lane: ChatLaneSchema.optional(),
    visitorName: z.string().max(120).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export type CreateChatSessionBody = z.infer<typeof CreateChatSessionBodySchema>;

export const PatchChatSessionBodySchema = z
  .object({
    lane: ChatLaneSchema.optional(),
    workspaceStatus: WorkspaceSessionStatusSchema.optional(),
    title: z.string().max(200).nullable().optional(),
    visitorName: z.string().max(120).nullable().optional(),
    unread: z.number().int().nonnegative().optional(),
    metadataPatch: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export type PatchChatSessionBody = z.infer<typeof PatchChatSessionBodySchema>;

export const AppendChatMessageBodySchema = z
  .object({
    content: z.string().min(1).max(CHAT_MESSAGE_MAX_LENGTH),
    mode: z.enum(["auto", "persist_only"]).default("auto"),
    /** Required when mode=persist_only for operator/system bubbles; visitor→USER rows. */
    bubbleWho: ChatBubbleWhoSchema.optional(),
    authorName: z.string().max(120).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.mode === "persist_only" && !data.bubbleWho) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "bubbleWho is required when mode is persist_only",
        path: ["bubbleWho"],
      });
    }
  });

export type AppendChatMessageBody = z.infer<typeof AppendChatMessageBodySchema>;

/** POST /chat/sessions/:id/messages when mode=persist_only */
export const ChatAppendPersistResponseSchema = z.object({
  ok: z.literal(true),
  message: ChatMessageDtoSchema,
});

/** POST /chat/sessions/:id/messages when mode=auto */
export const ChatAppendAutoResponseSchema = z.object({
  sessionId: z.string(),
  model: z.string().nullable(),
  toolUsed: z.boolean(),
  idempotentHit: z.boolean(),
  integrationRequired: z.boolean().optional(),
  messages: z.array(ChatMessageDtoSchema),
});

export const ChatSessionArchiveResponseSchema = z.object({
  ok: z.literal(true),
});
