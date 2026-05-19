import { z } from "zod";

export const AppNotificationSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  userId: z.string(),
  kind: z.string(),
  title: z.string(),
  body: z.unknown().nullable().optional(),
  readAt: z.string().nullable().optional(),
  deliveryState: z.string(),
  createdAt: z.string(),
});

export type AppNotification = z.infer<typeof AppNotificationSchema>;

export const NotificationsListResponseSchema = z.object({
  items: z.array(AppNotificationSchema),
  nextCursor: z.string().nullable(),
});

export const NotificationsUnreadCountSchema = z.object({
  count: z.number(),
});
