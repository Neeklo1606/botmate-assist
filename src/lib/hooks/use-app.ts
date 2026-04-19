/**
 * Хуки кабинета: ассистенты, лиды, KPI, dashboard, usage, team, notifications.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { repository, type DemoRequestPayload } from "@/lib/mock/repository";
import { qk } from "@/lib/query-keys";

export const useAssistants = () =>
  useQuery({ queryKey: qk.app.assistants, queryFn: () => repository.listAssistants() });

export const useLeads = () =>
  useQuery({ queryKey: qk.app.leads, queryFn: () => repository.listLeads() });

export const useKpi = () =>
  useQuery({ queryKey: qk.app.kpi, queryFn: () => repository.getKpi() });

export const useOnboarding = () =>
  useQuery({ queryKey: qk.app.onboarding, queryFn: () => repository.getOnboarding() });

export const useDashboardKpis = () =>
  useQuery({
    queryKey: qk.app.dashboardKpis,
    queryFn: () => repository.listDashboardKpis(),
  });

export const useActivity30d = () =>
  useQuery({
    queryKey: qk.app.activity,
    queryFn: () => repository.getActivity30d(),
  });

export const useTeamList = () =>
  useQuery({ queryKey: qk.app.team, queryFn: () => repository.listTeamMembers() });

export const useNotifications = () =>
  useQuery({
    queryKey: qk.app.notifications,
    queryFn: () => repository.listNotifications(),
  });

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repository.markNotificationRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.app.notifications });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => repository.markAllNotificationsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.app.notifications });
    },
  });
};

export const useUsage = () =>
  useQuery({ queryKey: qk.app.usage, queryFn: () => repository.getUsageStat() });

export const useCreateDemoRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DemoRequestPayload) => repository.createDemoRequest(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.app.leads });
    },
  });
};
