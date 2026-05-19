/**
 * AssistantOverview — обзор assistant-проекта (реальные KPI, без фейковых диалогов).
 */
import { Bot, Sparkles, ArrowRight } from "lucide-react";
import type { Project } from "@/lib/projects/types";

export function AssistantOverview({ project }: { project: Project }) {
  const stats = project.stats ?? {};
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Лидов сегодня" value={String(stats.leadsCount ?? 0)} accent />
        <KpiCard label="Диалогов" value={String(stats.conversationsCount ?? 0)} />
        <KpiCard label="Среднее время ответа" value={`${stats.avgResponseSec ?? 0} с`} />
        <KpiCard label="Удовлетворённость" value={`${stats.satisfactionPct ?? 0}%`} />
      </div>

      <section
        className="rounded-xl"
        style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
      >
        <header
          className="toolbar-row border-b px-5 py-3.5"
          style={{ borderColor: "#2a2a2a" }}
        >
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4" style={{ color: "#a8ff57" }} strokeWidth={1.75} />
            <h3 className="font-display text-sm font-semibold text-white">Последние диалоги</h3>
          </div>
        </header>
        <p className="px-5 py-8 text-center text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
          Диалоги появятся после подключения виджета и первых сообщений в чате.
        </p>
      </section>

      <section
        className="flex items-start gap-3 rounded-xl p-4"
        style={{ background: "rgba(168,255,87,0.06)", border: "1px solid rgba(168,255,87,0.20)" }}
      >
        <Sparkles className="h-4 w-4 flex-none" style={{ color: "#a8ff57" }} strokeWidth={1.75} />
        <div className="text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
          Совет: добавьте типовые вопросы клиентов в базу знаний — так ассистент отвечает точнее.
          <a className="ml-2 inline-flex items-center gap-1 font-semibold" style={{ color: "#a8ff57" }} href="/knowledge">
            Открыть знания <ArrowRight className="h-3 w-3" strokeWidth={2} />
          </a>
        </div>
      </section>
    </div>
  );
}

function KpiCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl p-4" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
      <div className="text-[11px] uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>
        {label}
      </div>
      <div
        className="mt-1 font-display text-2xl font-semibold tabular-nums"
        style={{ color: accent ? "#a8ff57" : "#ffffff" }}
      >
        {value}
      </div>
    </div>
  );
}
