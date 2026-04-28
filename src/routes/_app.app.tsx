/**
 * /app — Dashboard (Botmate dark theme).
 *
 * Палитра по спеке:
 *   bg #141414 · cards #1a1a1a · borders #2a2a2a · text #ffffff
 *   accent #a8ff57 (status, CTA)
 *
 * Секции:
 *   1) Readiness checklist
 *   2) Live visitors (главный wow-блок)
 *   3) Quick stats row
 *   4) Quick actions
 *
 * Данные — mock, описаны прямо в файле (TODO: заменить на real API).
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  X,
  ArrowRight,
  MessageSquare,
  Video,
  Smartphone,
  Monitor,
  MapPin,
  Plus,
  Inbox,
  MessageCircle,
} from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/_app/app")({
  component: DashboardPage,
});

/* ───── Mock data (TODO: replace with real API) ───── */

interface ReadinessItem {
  id: string;
  label: string;
  done: boolean;
  href: string;
}

const READINESS: ReadinessItem[] = [
  { id: "assistant", label: "Ассистент создан", done: true, href: "/assistants" },
  { id: "integration", label: "Интеграция подключена", done: true, href: "/app-integrations" },
  { id: "widget", label: "Виджет установлен", done: false, href: "/app-integrations" },
];

interface Visitor {
  id: string;
  number: number;
  color: string;
  currentPage: string;
  timeOnSite: string;
  pathTrail: string[];
  device: "mobile" | "desktop";
  deviceLabel: string;
  city: string;
  source: string;
  utm?: string;
}

const VISITORS: Visitor[] = [
  {
    id: "v1",
    number: 1,
    color: "#a8ff57",
    currentPage: "/pricing",
    timeOnSite: "2:34",
    pathTrail: ["Главная", "Услуги", "Цены"],
    device: "mobile",
    deviceLabel: "iPhone 15",
    city: "Москва",
    source: "Яндекс.Директ",
    utm: "utm_campaign=brand",
  },
  {
    id: "v2",
    number: 2,
    color: "#7dd3fc",
    currentPage: "/services/repair",
    timeOnSite: "0:48",
    pathTrail: ["Главная", "Услуги"],
    device: "desktop",
    deviceLabel: "MacBook",
    city: "Санкт-Петербург",
    source: "Google Organic",
  },
  {
    id: "v3",
    number: 3,
    color: "#fbbf24",
    currentPage: "/contacts",
    timeOnSite: "5:12",
    pathTrail: ["Главная", "О нас", "Кейсы", "Контакты"],
    device: "desktop",
    deviceLabel: "Windows",
    city: "Екатеринбург",
    source: "VK Ads",
    utm: "utm_source=vk",
  },
  {
    id: "v4",
    number: 4,
    color: "#f472b6",
    currentPage: "/blog/ai-sales",
    timeOnSite: "1:07",
    pathTrail: ["Блог"],
    device: "mobile",
    deviceLabel: "Android",
    city: "Казань",
    source: "Telegram",
  },
];

interface QuickStat {
  label: string;
  value: number;
  spark: number[];
  highlight?: boolean;
}

const QUICK_STATS: QuickStat[] = [
  { label: "Диалогов сегодня", value: 12, spark: [3, 5, 4, 7, 6, 9, 12] },
  { label: "Лидов сегодня", value: 4, spark: [0, 1, 1, 2, 2, 3, 4], highlight: true },
  { label: "Активных ассистентов", value: 1, spark: [1, 1, 1, 1, 1, 1, 1] },
  { label: "Звонков", value: 0, spark: [0, 0, 0, 0, 0, 0, 0] },
];

/* ───── Page ───── */

function DashboardPage() {
  const allReady = READINESS.every((r) => r.done);

  return (
    <div className="space-y-6 text-white">
      {/* Section 1 — Readiness checklist */}
      <ReadinessSection allReady={allReady} />

      {/* Section 2 — Live visitors */}
      <LiveVisitorsSection />

      {/* Section 3 — Quick stats */}
      <QuickStatsSection />

      {/* Section 4 — Quick actions */}
      <QuickActionsSection />
    </div>
  );
}

/* ═══════════ Section 1 — Readiness ═══════════ */

function ReadinessSection({ allReady }: { allReady: boolean }) {
  if (allReady) {
    return (
      <Card>
        <div
          className="flex items-center justify-between rounded-lg px-5 py-4"
          style={{ background: "rgba(168,255,87,0.08)", border: "1px solid rgba(168,255,87,0.25)" }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: "#a8ff57", color: "#0a0a0a" }}
            >
              <Check className="h-4 w-4" strokeWidth={3} />
            </span>
            <div>
              <div className="text-sm font-semibold text-white">
                Система готова к работе
              </div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                Все проверки пройдены — ассистент работает на ваших каналах.
              </div>
            </div>
          </div>
          <Check className="h-5 w-5" style={{ color: "#a8ff57" }} strokeWidth={2.5} />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-white">
          Готовность к запуску
        </h2>
        <span className="text-xs tabular-nums" style={{ color: "rgba(255,255,255,0.5)" }}>
          {READINESS.filter((r) => r.done).length} / {READINESS.length}
        </span>
      </div>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {READINESS.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-lg px-4 py-3"
            style={{ background: "#141414", border: "1px solid #2a2a2a" }}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              {item.done ? (
                <span
                  className="flex h-5 w-5 flex-none items-center justify-center rounded-full"
                  style={{ background: "#a8ff57", color: "#0a0a0a" }}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              ) : (
                <span
                  className="flex h-5 w-5 flex-none items-center justify-center rounded-full"
                  style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}
                >
                  <X className="h-3 w-3" strokeWidth={3} />
                </span>
              )}
              <span
                className="truncate text-sm"
                style={{ color: item.done ? "rgba(255,255,255,0.85)" : "#ffffff" }}
              >
                {item.label}
              </span>
            </div>
            {!item.done && (
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-2 w-2 animate-pulse rounded-full"
                  style={{ background: "#fbbf24" }}
                />
                <Link
                  to={item.href}
                  className="text-xs font-medium transition-colors hover:underline"
                  style={{ color: "#a8ff57" }}
                >
                  Настроить →
                </Link>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ═══════════ Section 2 — Live visitors ═══════════ */

function LiveVisitorsSection() {
  const count = VISITORS.length;

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-white">
            <span
              className="relative inline-flex h-2.5 w-2.5"
              aria-hidden
            >
              <span
                className="absolute inset-0 animate-ping rounded-full"
                style={{ background: "#a8ff57", opacity: 0.6 }}
              />
              <span
                className="relative inline-flex h-2.5 w-2.5 rounded-full"
                style={{ background: "#a8ff57" }}
              />
            </span>
            Сейчас на сайте
          </h2>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
            style={{ background: "rgba(168,255,87,0.12)", color: "#a8ff57" }}
          >
            {count} {pluralize(count, ["посетитель", "посетителя", "посетителей"])}
          </span>
        </div>
        <Link
          to="/visitors"
          className="text-sm font-medium transition-colors hover:text-white"
          style={{ color: "rgba(255,255,255,0.65)" }}
        >
          Смотреть всех →
        </Link>
      </div>

      {count === 0 ? (
        <EmptyVisitors />
      ) : (
        <ul className="space-y-2">
          {VISITORS.map((v) => (
            <VisitorRow key={v.id} v={v} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function VisitorRow({ v }: { v: Visitor }) {
  const DeviceIcon = v.device === "mobile" ? Smartphone : Monitor;
  return (
    <li
      className="group flex flex-col gap-3 rounded-lg p-4 transition-colors md:flex-row md:items-center"
      style={{ background: "#141414", border: "1px solid #2a2a2a" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(168,255,87,0.35)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a";
      }}
    >
      {/* Avatar */}
      <div
        className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-sm font-bold tabular-nums"
        style={{ background: v.color, color: "#0a0a0a" }}
        aria-label={`Анонимный посетитель #${v.number}`}
      >
        #{v.number}
      </div>

      {/* Main info */}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-mono text-sm font-semibold text-white">
            {v.currentPage}
          </span>
          <span
            className="rounded-md px-1.5 py-0.5 text-[11px] font-medium tabular-nums"
            style={{ background: "rgba(168,255,87,0.12)", color: "#a8ff57" }}
          >
            ⏱ {v.timeOnSite}
          </span>
        </div>

        {/* Path trail */}
        <div
          className="flex flex-wrap items-center gap-1 text-xs"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          {v.pathTrail.map((p, i) => (
            <span key={i} className="inline-flex items-center gap-1">
              <span>{p}</span>
              {i < v.pathTrail.length - 1 && (
                <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
              )}
            </span>
          ))}
        </div>

        {/* Meta row */}
        <div
          className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          <span className="inline-flex items-center gap-1">
            <DeviceIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
            {v.deviceLabel}
          </span>
          <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
            {v.city}
          </span>
          <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span>
          <span className="inline-flex items-center gap-1.5">
            <span style={{ color: "rgba(255,255,255,0.85)" }}>{v.source}</span>
            {v.utm && (
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wide"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.7)",
                  border: "1px solid #2a2a2a",
                }}
              >
                UTM
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Hover actions */}
      <div className="flex items-center gap-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-opacity hover:opacity-90"
          style={{ background: "#a8ff57", color: "#0a0a0a" }}
        >
          <MessageSquare className="h-3.5 w-3.5" strokeWidth={2} />
          Написать
        </button>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-white transition-colors hover:bg-white/10"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid #2a2a2a" }}
        >
          <Video className="h-3.5 w-3.5" strokeWidth={2} />
          Позвонить
        </button>
      </div>
    </li>
  );
}

function EmptyVisitors() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-lg px-6 py-10 text-center"
      style={{ background: "#141414", border: "1px dashed #2a2a2a" }}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full"
        style={{ background: "rgba(255,255,255,0.05)" }}
      >
        <Monitor className="h-5 w-5" style={{ color: "rgba(255,255,255,0.4)" }} strokeWidth={1.5} />
      </div>
      <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
        Никого нет на сайте прямо сейчас.
        <br />
        Установите виджет, чтобы начать.
      </p>
      <Link
        to="/app-integrations"
        className="mt-1 inline-flex h-9 items-center rounded-md px-4 text-sm font-semibold transition-opacity hover:opacity-90"
        style={{ background: "#a8ff57", color: "#0a0a0a" }}
      >
        Установить виджет
      </Link>
    </div>
  );
}

/* ═══════════ Section 3 — Quick stats ═══════════ */

function QuickStatsSection() {
  return (
    <section
      aria-label="Статистика за сегодня"
      className="grid grid-cols-2 gap-3 md:grid-cols-4"
    >
      {QUICK_STATS.map((s) => (
        <StatCard key={s.label} stat={s} />
      ))}
    </section>
  );
}

function StatCard({ stat }: { stat: QuickStat }) {
  const color = stat.highlight ? "#a8ff57" : "#ffffff";
  const data = stat.spark.map((y, i) => ({ x: i, y }));
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
    >
      <div
        className="text-[11px] font-medium uppercase tracking-wide"
        style={{ color: "rgba(255,255,255,0.5)" }}
      >
        {stat.label}
      </div>
      <div className="mt-1 flex items-end justify-between gap-2">
        <div
          className="font-display text-3xl font-semibold tabular-nums leading-none"
          style={{ color }}
        >
          {stat.value}
        </div>
        <div className="h-9 w-20">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
              <Line
                type="monotone"
                dataKey="y"
                stroke={color}
                strokeWidth={1.75}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Section 4 — Quick actions ═══════════ */

function QuickActionsSection() {
  return (
    <section aria-label="Быстрые действия" className="flex flex-wrap gap-2">
      <Link
        to="/assistants"
        className="inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold transition-opacity hover:opacity-90"
        style={{ background: "#a8ff57", color: "#0a0a0a" }}
      >
        <Plus className="h-4 w-4" strokeWidth={2.25} />
        Создать ассистента
      </Link>
      <Link
        to="/chat"
        className="inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-medium text-white transition-colors hover:bg-white/10"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #2a2a2a" }}
      >
        <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
        Открыть чат
      </Link>
      <Link
        to="/leads"
        className="inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-medium text-white transition-colors hover:bg-white/10"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #2a2a2a" }}
      >
        <Inbox className="h-4 w-4" strokeWidth={1.75} />
        Посмотреть лиды
      </Link>
    </section>
  );
}

/* ═══════════ Helpers ═══════════ */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="rounded-xl p-5 md:p-6"
      style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
    >
      {children}
    </section>
  );
}

function pluralize(n: number, forms: [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}
