/**
 * SiteOverview — превью лендинга + список заявок + аналитика.
 */
import { ExternalLink, Globe, Inbox } from "lucide-react";
import type { Project } from "@/lib/projects/types";

interface Lead {
  id: string;
  name: string;
  contact: string;
  source: string;
  time: string;
}

const LEADS: Lead[] = [
  { id: "l1", name: "Иван Петров",   contact: "+7 (905) 123-45-67",      source: "Кнопка hero", time: "5 мин" },
  { id: "l2", name: "Анна",          contact: "anna@example.ru",         source: "Форма низа", time: "1 ч" },
  { id: "l3", name: "Сергей К.",     contact: "@sergeyk",                source: "Telegram CTA", time: "3 ч" },
  { id: "l4", name: "Ольга М.",      contact: "+7 (916) 555-22-11",      source: "Кнопка hero", time: "вчера" },
];

export function SiteOverview({ project }: { project: Project }) {
  const stats = project.stats ?? {};
  const data = project.briefData;
  const offer = (data.offer as string) || project.name;
  const audience = (data.audience as string) || "ваша аудитория";
  const previewUrl = `https://${slug(project.name)}.botme.site`;

  return (
    <div className="space-y-5">
      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Заявок" value={String(stats.formSubmits ?? 0)} accent />
        <Kpi label="Просмотры" value={fmt(stats.pageViews ?? 0)} />
        <Kpi label="Среднее время" value={`${stats.avgTimeOnPageSec ?? 0}c`} />
        <Kpi label="Конверсия" value={pct(stats.formSubmits, stats.pageViews)} />
      </div>

      {/* Site preview */}
      <section className="rounded-xl overflow-hidden" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
        <header className="flex items-center justify-between border-b px-5 py-3.5" style={{ borderColor: "#2a2a2a" }}>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" style={{ color: "#a8ff57" }} strokeWidth={1.75} />
            <h3 className="font-display text-sm font-semibold text-white">Превью лендинга</h3>
          </div>
          <a
            href={previewUrl}
            onClick={(e) => e.preventDefault()}
            className="inline-flex items-center gap-1 text-xs font-semibold"
            style={{ color: "#a8ff57" }}
            title="Откроется после публикации"
          >
            {previewUrl} <ExternalLink className="h-3 w-3" strokeWidth={2} />
          </a>
        </header>

        {/* Browser-mock */}
        <div className="p-5">
          <div className="overflow-hidden rounded-lg" style={{ border: "1px solid #2a2a2a", background: "#0f0f0f" }}>
            <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: "#141414", borderBottom: "1px solid #2a2a2a" }}>
              <span className="h-2 w-2 rounded-full" style={{ background: "#ff5f57" }} />
              <span className="h-2 w-2 rounded-full" style={{ background: "#febc2e" }} />
              <span className="h-2 w-2 rounded-full" style={{ background: "#28c840" }} />
              <span className="ml-3 truncate font-mono text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>{previewUrl}</span>
            </div>
            <div className="px-6 py-10 text-center">
              <h4 className="font-display text-2xl font-semibold tracking-tight text-white md:text-3xl">
                {offer}
              </h4>
              <p className="mx-auto mt-3 max-w-md text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                Для {audience}. Оставьте заявку — свяжемся за 15 минут.
              </p>
              <button
                type="button"
                disabled
                className="mt-5 inline-flex h-10 items-center rounded-md px-5 text-sm font-semibold opacity-90"
                style={{ background: "#a8ff57", color: "#0a0a0a" }}
              >
                Оставить заявку
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Leads */}
      <section className="rounded-xl" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
        <header className="flex items-center justify-between border-b px-5 py-3.5" style={{ borderColor: "#2a2a2a" }}>
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4" style={{ color: "#a8ff57" }} strokeWidth={1.75} />
            <h3 className="font-display text-sm font-semibold text-white">Заявки с лендинга</h3>
          </div>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>mock</span>
        </header>
        <ul className="divide-y" style={{ borderColor: "#2a2a2a" }}>
          {LEADS.map((l) => (
            <li key={l.id} className="grid grid-cols-1 gap-1 px-5 py-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center sm:gap-4">
              <div>
                <div className="text-sm font-semibold text-white">{l.name}</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{l.contact}</div>
              </div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{l.source}</div>
              <div className="text-xs tabular-nums sm:text-right" style={{ color: "rgba(255,255,255,0.45)" }}>{l.time}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl p-4" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
      <div className="text-[11px] uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</div>
      <div className="mt-1 font-display text-2xl font-semibold tabular-nums" style={{ color: accent ? "#a8ff57" : "#ffffff" }}>
        {value}
      </div>
    </div>
  );
}

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
function pct(a?: number, b?: number): string {
  if (!a || !b) return "—";
  return `${((a / b) * 100).toFixed(1)}%`;
}
function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9а-я]+/gi, "-").replace(/^-|-$/g, "").slice(0, 24) || "site";
}
