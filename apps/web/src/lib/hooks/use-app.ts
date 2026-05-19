/**
 * Хуки кабинета: ассистенты, лиды, уведомления, команда.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { qk } from "@/lib/query-keys";
import type { Notification, NotificationKind, User } from "@/types/entities";
import { resolveAssistantsPersistence } from "@/lib/assistants/config";
import { dtoToAssistant } from "@/lib/assistants/map-dto";
import { isRealAuthEnabled } from "@/lib/auth/config";
import { useLeads as useLeadsQuery } from "@/lib/leads/hooks";
import { useWorkspaceUsage } from "@/lib/hooks/use-workspace-saas";

function assistantsQueriesEnabled(userId: string | undefined): boolean {
  return !!userId && typeof window !== "undefined";
}

function tenantQueryKey(user: User | null | undefined): string {
  return user?.tenantId ?? "local";
}

function mapNotification(row: {
  id: string;
  kind: string;
  title: string;
  body?: unknown;
  createdAt: string;
  readAt?: string | null;
}): Notification {
  const description =
    typeof row.body === "object" && row.body !== null && "text" in row.body
      ? String((row.body as { text?: string }).text ?? "")
      : typeof row.body === "string"
        ? row.body
        : "";
  return {
    id: row.id,
    kind: row.kind as NotificationKind,
    title: row.title,
    description,
    createdAt: row.createdAt,
    read: !!row.readAt,
  };
}

export const useAssistants = () => {
  const { data: user } = useQuery<User | null>({ queryKey: qk.auth.currentUser });
  const userId = user?.id;
  const tenantKey = tenantQueryKey(user);
  const persistence = resolveAssistantsPersistence(user);

  return useQuery({
    queryKey: qk.assistants.list(tenantKey, userId ?? "anon"),
    queryFn: async () => {
      if (!userId || persistence !== "api") return [];
      const res = await apiClient.listAssistants({ page: 1, pageSize: 100 });
      return res.items.map(dtoToAssistant);
    },
    enabled: assistantsQueriesEnabled(userId) && persistence === "api",
    staleTime: 5_000,
  });
};

export const useLeads = () => {
  const { data: user } = useQuery<User | null>({ queryKey: qk.auth.currentUser });
  return useLeadsQuery(user ?? undefined);
};

export const useTeamList = () => {
  const enabled = isRealAuthEnabled();
  return useQuery({
    queryKey: qk.app.team,
    queryFn: async () => {
      const res = await apiClient.getWorkspaceMembers();
      return res.items.map((m) => ({
        id: m.id,
        name: m.fullName ?? m.email,
        email: m.email,
        role: m.role.toLowerCase() as "owner" | "admin" | "operator" | "viewer",
        status: "active" as const,
        initials: (m.fullName ?? m.email).slice(0, 2).toUpperCase(),
        joinedAt: m.createdAt,
      }));
    },
    enabled,
    staleTime: 60_000,
  });
};

export const useNotifications = () => {
  const enabled = isRealAuthEnabled();
  return useQuery({
    queryKey: qk.app.notifications,
    queryFn: async () => {
      const res = await apiClient.listNotifications({ limit: 40 });
      return res.items.map(mapNotification);
    },
    enabled,
    staleTime: 15_000,
  });
};

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.markNotificationRead(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.app.notifications });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.listNotifications({ limit: 100 });
      await Promise.all(
        res.items.filter((n) => !n.readAt).map((n) => apiClient.markNotificationRead(n.id)),
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.app.notifications });
    },
  });
};

export { useWorkspaceUsage as useUsage };
