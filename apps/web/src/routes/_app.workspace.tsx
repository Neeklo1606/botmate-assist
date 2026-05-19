/**
 * Phase 13A/13B — Customer center: plan, team, integrations, onboarding, support.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";
import {
  Activity,
  Copy,
  Download,
  HeartPulse,
  Loader2,
  Plug,
  Users,
  Wrench,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { PlanTierBadge } from "@/components/workspace/plan-tier-badge";
import { UsageQuotaBar } from "@/components/workspace/usage-quota-bar";
import { FeatureLockCard } from "@/components/workspace/feature-lock-card";
import { SelfServeOnboardingPanel } from "@/components/workspace/self-serve-onboarding-panel";
import { InviteMemberDialog } from "@/components/workspace/invite-member-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isRealAuthEnabled } from "@/lib/auth/config";
import {
  useOpenAiIntegrationStatus,
  useWorkspaceInvites,
  useWorkspaceOverview,
  useWorkspaceSupportDiagnostics,
  useWorkspaceUsage,
} from "@/lib/hooks/use-workspace-saas";
import { useTeamList } from "@/lib/hooks/use-app";
import { CABINET_RU } from "@/lib/i18n/cabinet-ru";
import { runtimeTenantUiEnabled } from "@/lib/runtime/config";
import { toast } from "sonner";

const workspaceSearchSchema = z.object({
  tab: z
    .enum(["overview", "team", "integrations", "onboarding", "support"])
    .optional()
    .default("overview"),
});

export const Route = createFileRoute("/_app/workspace")({
  validateSearch: workspaceSearchSchema,
  head: () => ({
    meta: [{ title: "Рабочая область — botme" }],
  }),
  component: WorkspaceHubPage,
});

const TAB_LABEL: Record<"overview" | "team" | "integrations" | "onboarding" | "support", string> = {
  overview: CABINET_RU.workspace.tabs.overview,
  team: CABINET_RU.workspace.tabs.team,
  integrations: CABINET_RU.workspace.tabs.integrations,
  onboarding: CABINET_RU.workspace.tabs.onboarding,
  support: CABINET_RU.workspace.tabs.support,
};

const LIFECYCLE_LABEL: Record<string, string> = {
  invited: CABINET_RU.lifecycle.invited,
  onboarded: CABINET_RU.lifecycle.onboarded,
  activated: CABINET_RU.lifecycle.activated,
  retained: CABINET_RU.lifecycle.retained,
  advanced_runtime: CABINET_RU.lifecycle.advanced_runtime,
  enterprise_candidate: CABINET_RU.lifecycle.enterprise_candidate,
  churn_risk: CABINET_RU.lifecycle.churn_risk,
};

function WorkspaceHubPage() {
  const { tab = "overview" } = Route.useSearch();
  const realAuth = isRealAuthEnabled();
  const overview = useWorkspaceOverview(realAuth);
  const usage = useWorkspaceUsage(realAuth);
  const diagnostics = useWorkspaceSupportDiagnostics(realAuth);
  const openAi = useOpenAiIntegrationStatus(realAuth);
  const invites = useWorkspaceInvites(realAuth);
  const members = useTeamList();

  const exportJson = useMemo(() => {
    if (!diagnostics.data) return "";
    return JSON.stringify(diagnostics.data, null, 2);
  }, [diagnostics.data]);

  const quotaItems = useMemo(
    () =>
      usage.data
        ? [
            usage.data.executions,
            usage.data.browserRuns,
            usage.data.assistants,
            usage.data.knowledgeDocuments,
            usage.data.members,
          ]
        : [],
    [usage.data],
  );

  if (!realAuth) {
    return (
      <div className="space-y-6">
        <PageHeader title={CABINET_RU.workspace.title} description={CABINET_RU.workspace.demoAuth} />
        <section className="rounded-xl border border-border bg-background p-6 text-sm text-ink-muted">
          {CABINET_RU.workspace.demoAuth}
        </section>
      </div>
    );
  }

  if (overview.isLoading || !overview.data) {
    return (
      <div className="flex items-center gap-2 py-12 text-sm text-ink-muted">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        {CABINET_RU.common.loading}
      </div>
    );
  }

  const o = overview.data;

  const copySupportBundle = async () => {
    if (!exportJson) return;
    try {
      await navigator.clipboard.writeText(exportJson);
      toast.success("Диагностика скопирована");
    } catch {
      toast.error("Не удалось скопировать — попробуйте скачать JSON");
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={o.tenantName}
        description={CABINET_RU.workspace.description}
        actions={
          <div className="flex items-center gap-2">
            <PlanTierBadge tier={o.planTier} />
            {o.suspended ?
              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-300">
                {CABINET_RU.workspace.suspended}
              </span>
            : null}
          </div>
        }
      />

      <Tabs value={tab} className="w-full">
        <TabsList className="flex h-auto flex-wrap gap-1 border border-[#2a2a2a] bg-[#1a1a1a]">
          {(["overview", "team", "integrations", "onboarding", "support"] as const).map((t) => (
            <TabsTrigger key={t} value={t} asChild>
              <Link to="/workspace" search={{ tab: t }}>
                {TAB_LABEL[t]}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {!o.entitlements.runtimeUi && runtimeTenantUiEnabled() ?
            <FeatureLockCard
              title={CABINET_RU.upgrade.runtimeTitle}
              description={CABINET_RU.upgrade.runtimeDesc}
              currentTier={o.planTier}
              requiredTier="pro"
            />
          : null}
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="space-y-4 rounded-xl border border-border bg-[#1a1a1a] p-5">
              <div className="flex items-center gap-2 text-white">
                <Activity className="size-4 text-lime-400" aria-hidden />
                <h2 className="text-sm font-medium">{CABINET_RU.workspace.usageMonth}</h2>
              </div>
              {usage.isLoading ?
                <p className="text-xs text-white/45">{CABINET_RU.common.loading}</p>
              : quotaItems.length ?
                <div className="space-y-4">
                  {quotaItems.map((item) => (
                    <UsageQuotaBar key={item.key} item={item} />
                  ))}
                </div>
              : <p className="text-xs text-white/45">Данные об использовании недоступны</p>}
            </section>
            <section className="space-y-3 rounded-xl border border-border bg-[#1a1a1a] p-5">
              <div className="flex items-center gap-2 text-white">
                <HeartPulse className="size-4 text-lime-400" aria-hidden />
                <h2 className="text-sm font-medium">{CABINET_RU.workspace.customerHealth}</h2>
              </div>
              <p className="text-xs text-white/50">
                Этап:{" "}
                <span className="font-medium text-white/80">
                  {LIFECYCLE_LABEL[o.lifecycleStage] ?? o.lifecycleStage}
                </span>
              </p>
              <ul className="list-disc space-y-1 pl-4 text-xs text-white/60">
                {o.recommendedNextSteps.slice(0, 5).map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="team" className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-white">Участники</h2>
            <InviteMemberDialog planTier={o.planTier} />
          </div>
          {members.isLoading ?
            <p className="text-xs text-white/45">{CABINET_RU.common.loading}</p>
          : (
            <ul className="divide-y divide-[#2a2a2a] rounded-xl border border-[#2a2a2a] bg-[#1a1a1a]">
              {members.data?.map((m) => (
                <li key={m.id} className="toolbar-row px-4 py-3 text-sm">
                  <div>
                    <div className="font-medium text-white">{m.name}</div>
                    <div className="text-white/50">{m.email}</div>
                  </div>
                  <span className="text-xs uppercase text-white/45">{m.role}</span>
                </li>
              ))}
            </ul>
          )}
          {invites.data?.items.filter((i) => i.status === "pending").length ?
            <div className="mt-2">
              <h3 className="mb-2 text-xs font-medium text-white/60">{CABINET_RU.workspace.pendingInvites}</h3>
              <ul className="space-y-1 text-xs text-white/55">
                {invites.data.items
                  .filter((i) => i.status === "pending")
                  .map((i) => (
                    <li key={i.id}>
                      {i.email} · {i.role}
                    </li>
                  ))}
              </ul>
            </div>
          : null}
        </TabsContent>

        <TabsContent value="integrations" className="mt-6">
          <section className="space-y-3 rounded-xl border border-border bg-[#1a1a1a] p-5">
            <div className="flex items-center gap-2 text-white">
              <Plug className="size-4 text-lime-400" />
              <h2 className="text-sm font-medium">OpenAI</h2>
            </div>
            <p className="text-sm text-white/70">
              {openAi.data?.configured ?
                `Подключено ${openAi.data.maskedKey ?? ""}`
              : "Не подключено — нужно для чата и ассистентов."}
            </p>
            <p className="text-xs text-white/45">
              Ключ задаётся в разделе «Интеграции» или через API с сессионной авторизацией.
            </p>
          </section>
        </TabsContent>

        <TabsContent value="onboarding" className="mt-6">
          <SelfServeOnboardingPanel />
        </TabsContent>

        <TabsContent value="support" className="mt-6">
          <section className="space-y-3 rounded-xl border border-border bg-[#1a1a1a] p-5">
            <div className="flex items-center gap-2 text-white">
              <Wrench className="size-4 text-lime-400" aria-hidden />
              <h2 className="text-sm font-medium">{CABINET_RU.workspace.supportDiagnostics}</h2>
            </div>
            {diagnostics.isLoading ?
              <p className="text-xs text-white/45">{CABINET_RU.common.loading}</p>
            : diagnostics.data ?
              <>
                <ul className="space-y-1 text-xs text-white/55">
                  {diagnostics.data.hints.map((h) => (
                    <li key={h}>• {h}</li>
                  ))}
                </ul>
                <p className="text-xs text-white/40">
                  Воркер: Redis {diagnostics.data.worker.redisConfigured ? "ок" : "нет"} · очереди{" "}
                  {diagnostics.data.worker.queuesAvailable ? "ок" : "недоступны"}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => void copySupportBundle()}>
                    <Copy className="size-3.5" />
                    {CABINET_RU.common.copy}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const blob = new Blob([exportJson], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `botmate-support-${o.tenantId.slice(0, 8)}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download className="size-3.5" />
                    {CABINET_RU.common.download}
                  </Button>
                </div>
              </>
            : null}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
