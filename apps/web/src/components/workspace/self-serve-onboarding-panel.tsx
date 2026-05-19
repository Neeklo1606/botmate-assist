import { Link } from "@tanstack/react-router";
import { Check, Circle, Loader2 } from "lucide-react";
import { useWorkspaceOnboarding } from "@/lib/hooks/use-workspace-saas";
import { isRealAuthEnabled } from "@/lib/auth/config";
import { runtimeTenantUiEnabled } from "@/lib/runtime/config";

const STEPS: Array<{
  key: keyof NonNullable<ReturnType<typeof useWorkspaceOnboarding>["data"]>["onboardingSteps"];
  label: string;
  href: string;
}> = [
  { key: "assistantCreated", label: "Создать ассистента", href: "/assistants" },
  { key: "openAiConfigured", label: "Подключить OpenAI", href: "/workspace?tab=integrations" },
  { key: "knowledgeUploaded", label: "Загрузить знания", href: "/knowledge" },
  { key: "firstChatSuccess", label: "Первый диалог в чате", href: "/chat" },
  { key: "runtimeOpened", label: "Открыть журнал исполнений", href: "/runtime" },
];

const LIFECYCLE_LABELS: Record<string, string> = {
  invited: "Приглашён",
  onboarded: "Подключение",
  activated: "Активирован",
  retained: "Постоянный пользователь",
  advanced_runtime: "Опытный пользователь",
  enterprise_candidate: "Enterprise-кандидат",
  churn_risk: "Риск оттока",
};

export function SelfServeOnboardingPanel() {
  const enabled = isRealAuthEnabled();
  const onboarding = useWorkspaceOnboarding(enabled);

  if (!enabled) return null;
  if (onboarding.isLoading) {
    return (
      <section className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#1a1a1a] p-4 text-sm text-white/50">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Загрузка онбординга…
      </section>
    );
  }
  if (!onboarding.data) return null;
  if (onboarding.data.onboardingSteps.onboardingCompleted) {
    return (
      <section className="rounded-xl border border-lime-500/20 bg-lime-500/5 p-4 text-sm text-lime-200/90">
        Онбординг завершён — пригласите команду или откройте журнал исполнений.
      </section>
    );
  }

  const showRuntime = runtimeTenantUiEnabled();
  const steps = STEPS.filter((s) => s.key !== "runtimeOpened" || showRuntime);
  const stageLabel =
    LIFECYCLE_LABELS[onboarding.data.lifecycleStage] ??
    onboarding.data.lifecycleStage.replace(/_/g, " ");

  return (
    <section className="rounded-xl border border-white/10 bg-[#1a1a1a] p-4" aria-label="Онбординг">
      <h2 className="text-sm font-medium text-white mb-1">Чеклист настройки</h2>
      <p className="text-xs text-white/45 mb-3">Этап: {stageLabel}</p>
      <ul className="space-y-2">
        {steps.map((step) => {
          const done = Boolean(onboarding.data?.onboardingSteps[step.key]);
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
      {onboarding.data.recommendedActions[0] ?
        <p className="mt-3 text-xs text-lime-200/80">{onboarding.data.recommendedActions[0]}</p>
      : null}
    </section>
  );
}
