import { useQuery } from "@tanstack/react-query";
import type { TenantActivationSnapshot } from "@botmate/shared";
import { apiClient } from "@/lib/api/client";
import { isRealAuthEnabled } from "@/lib/auth/config";
import { qk } from "@/lib/query-keys";

export function useProductActivation(enabled = isRealAuthEnabled()) {
  return useQuery({
    queryKey: qk.product.activation,
    queryFn: () => apiClient.getProductActivation(),
    enabled,
    staleTime: 60_000,
  });
}

export function activationNextStep(snapshot: TenantActivationSnapshot | undefined): {
  label: string;
  href: string;
  reason: string;
} | null {
  if (!snapshot) return null;
  const { milestones } = snapshot;
  if (!milestones.firstAssistantCreated) {
    return { label: "Создать ассистента", href: "/assistants", reason: "Пока нет ассистента" };
  }
  if (!milestones.firstKnowledgeUploaded) {
    return { label: "Загрузить знания", href: "/knowledge", reason: "Ответы на основе ваших материалов" };
  }
  if (!milestones.firstChatSuccess) {
    return { label: "Проверить чат", href: "/chat", reason: "Убедитесь, что ассистент отвечает" };
  }
  if (!milestones.runtimeOpened) {
    return {
      label: "Открыть журнал исполнений",
      href: "/runtime",
      reason: "Здесь видно, как ассистент отвечал на сообщения",
    };
  }
  return null;
}
