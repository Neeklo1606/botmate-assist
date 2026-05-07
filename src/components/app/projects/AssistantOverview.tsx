/**
 * AssistantOverview — content для готового assistant-проекта.
 * Mock: live inbox-style список диалогов + KPI.
 */
import { Bot, MessageSquare, Sparkles, ArrowRight, User } from "lucide-react";
import type { Project } from "@/lib/projects/types";

interface Conversation {
  id: string;
  visitor: string;
  channel: string;
  lastMessage: string;
  status: "lead" | "active" | "closed";
  time: string;
}

const MOCK_CONVERSATIONS: Conversation[] = [
  { id: "c1", visitor: "Анонимный #14", channel: "Сайт", lastMessage: "Подскажите, есть ли в наличии…", status: "lead", time: "сейчас" },
  { id: "c2", visitor: "Алексей",       channel: "Telegram", lastMessage: "Спасибо, оставлю заявку",      status: "lead", time: "5 мин" },
  { id: "c3", visitor: "Мария К.",      channel: "WhatsApp", lastMessage: "Понятно, подумаю",             status: "active", time: "12 мин" },
  { id: "c4", visitor: "Анонимный #11", channel: "Сайт",     lastMessage: "Спасибо!",                     status: "closed", time: "1 ч" },
];

export function AssistantOverview({ project }: { project: Project }) {
  const stats = project.stats ?? {};
  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Лидов сегодня" value={String(stats.leadsCount ?? 0)} accent />
        <KpiCard label="Диалогов" value={String(stats.conversationsCount ?? 0)} />
        <KpiCard label="Среднее время ответа" value={`${stats.avgResponseSec ?? 0}c`} />
        <KpiCard label="Удовлетворённость" value={`${stats.satisfactionPct ?? 0}%`} />
      </div>

      {/* Inbox */}
      <section
        className="rounded-xl"
        style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
      >
        <header className="flex items-center justify-between border-b px-5 py-3.5"
          style={{ borderColor: "#2a2a2a" }}>
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4" style={{ color: "#a8ff57" }} strokeWidth={1.75} />
            <h3 className="font-display text-sm font-semibold text-white">Последние диалоги</h3>
          </div>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            mock — реальные данные после запуска ассистента
          </span>
        </header>
        <ul className="divide-y" style={{ borderColor: "#2a2a2a" }}>
          {MOCK_CONVERSATIONS.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.02]">
              <span
                className="flex h-9 w-9 flex-none items-center justify-center rounded-full"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #2a2a2a" }}
              >
                <User className="h-4 w-4" style={{ color: "rgba(255,255,255,0.6)" }} strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-white">{c.visitor}</span>
                  <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>· {c.channel}</span>
                </div>
                <div className="mt-0.5 line-clamp-1 text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
                  {c.lastMessage}
                </div>
              </div>
              <StatusPill status={c.status} />
              <span className="hidden text-[11px] tabular-nums sm:inline" style={{ color: "rgba(255,255,255,0.4)" }}>
                {c.time}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Suggestions */}
      <section
        className="flex items-start gap-3 rounded-xl p-4"
        style={{ background: "rgba(168,255,87,0.06)", border: "1px solid rgba(168,255,87,0.20)" }}
      >
        <Sparkles className="h-4 w-4 flex-none" style={{ color: "#a8ff57" }} strokeWidth={1.75} />
        <div className="text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
          Совет: добавьте 5 типовых вопросов клиентов в раздел знаний — это поднимет точность ответов на ~20%.
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
      <div className="text-[11px] uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</div>
      <div className="mt-1 font-display text-2xl font-semibold tabular-nums" style={{ color: accent ? "#a8ff57" : "#ffffff" }}>
        {value}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: Conversation["status"] }) {
  const map = {
    lead:   { label: "Лид",     bg: "rgba(168,255,87,0.12)", fg: "#a8ff57" },
    active: { label: "Активный", bg: "rgba(125,211,252,0.10)", fg: "#7dd3fc" },
    closed: { label: "Закрыт",  bg: "rgba(255,255,255,0.05)", fg: "rgba(255,255,255,0.55)" },
  } as const;
  const c = map[status];
  return (
    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ background: c.bg, color: c.fg }}>
      {c.label}
    </span>
  );
}
