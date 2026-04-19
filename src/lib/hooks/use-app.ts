/**
 * Хуки кабинета: ассистенты, лиды, KPI, onboarding.
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

export const useCreateDemoRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DemoRequestPayload) => repository.createDemoRequest(payload),
    onSuccess: () => {
      // Заявка попадёт в общий поток лидов после интеграции с api-репозиторием.
      qc.invalidateQueries({ queryKey: qk.app.leads });
    },
  });
};
