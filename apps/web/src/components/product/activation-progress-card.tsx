/**
 * Чеклист активации tenant (данные API).
 */
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Check, Circle, Loader2 } from "lucide-react";
import type { TenantActivationSnapshot } from "@botmate/shared";
import { apiClient } from "@/lib/api/client";
import { isRealAuthEnabled } from "@/lib/auth/config";
import { CABINET_RU } from "@/lib/i18n/cabinet-ru";
import { qk } from "@/lib/query-keys";
import { runtimeTenantUiEnabled } from "@/lib/runtime/config";

const STEPS: Array<{
  key: string;
  label: string;
  href: string;
  milestoneKey: keyof TenantActivationSnapshot["milestones"];
}> = [
  { key: "assistant", label: CABINET_RU.activation.assistant, href: "/assistants", milestoneKey: "firstAssistantCreated" },
  { key: "knowledge", label: CABINET_RU.activation.knowledge, href: "/knowledge", milestoneKey: "firstKnowledgeUploaded" },
  { key: "chat", label: CABINET_RU.activation.chat, href: "/chat", milestoneKey: "firstChatSuccess" },
  { key: "runtime", label: CABINET_RU.activation.runtime, href: "/runtime", milestoneKey: "runtimeOpened" },
];

export function ActivationProgressCard() {
  const enabled = isRealAuthEnabled();

  const activation = useQuery({
    queryKey: qk.product.activation,
    queryFn: () => apiClient.getProductActivation(),
    enabled,
    staleTime: 60_000,
  });

  if (!enabled) return null;
  if (!activation.data) {
    if (activation.isLoading) {
      return (
        <section className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#1a1a1a] p-4 text-sm text-white/50">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {CABINET_RU.common.loading}
        </section>
      );
    }
    return null;
  }

  const { milestones, health, hints } = activation.data;
  const showRuntime = runtimeTenantUiEnabled();

  return (
    <section
      className="rounded-xl border border-white/10 bg-[#1a1a1a] p-4"
      aria-label="Активация рабочей области"
    >
      <div className="mb-3">
        <h2 className="text-sm font-medium text-white">{CABINET_RU.activation.title}</h2>
        <p className="text-xs text-white/45">Статус: {health.replace(/_/g, " ")}</p>
      </div>
      <ul className="space-y-2">
        {STEPS.filter((s) => s.key !== "runtime" || showRuntime).map((step) => {
          const done = milestones[step.milestoneKey];
          return (
            <li key={step.key}>
              <Link
                to={step.href}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-white/80 hover:bg-white/5"
              >
                {done ?
                  <Check className="size-4 shrink-0 text-lime-400" aria-hidden />
                : <Circle className="size-4 shrink-0 text-white/30" aria-hidden />}
                <span className={done ? "text-white/55 line-through" : undefined}>{step.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      {hints.length > 0 ?
        <p className="mt-3 text-xs text-lime-200/80">{hints[0]}</p>
      : null}
    </section>
  );
}
