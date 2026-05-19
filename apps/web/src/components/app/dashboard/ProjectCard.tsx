/**
 * ProjectCard — карточка проекта в кабинете.
 *
 * Состояния:
 * - preparing: animated indicator + "Готовится…" + прогресс-бар по времени.
 * - ready:     mock-статистика, зависит от kind (assistant/media/site).
 * - draft/paused: badge статуса.
 *
 * Открытие проекта (детальная страница) — в следующем этапе (7C).
 * Сейчас "Открыть" ведёт на /app до момента, как появятся /app/projects/$id.
 */
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bot, Sparkles, Globe, ArrowRight, Loader2 } from "lucide-react";
import type { Project, ProjectKind } from "@/lib/projects/types";

interface Props {
  project: Project;
}

const KIND_META: Record<
  ProjectKind,
  { label: string; icon: typeof Bot; gradient: string }
> = {
  assistant: {
    label: "Ассистент",
    icon: Bot,
    gradient:
      "radial-gradient(80% 80% at 100% 0%, rgba(125,211,252,0.10) 0%, transparent 60%)",
  },
  media: {
    label: "Медиа-студия",
    icon: Sparkles,
    gradient:
      "radial-gradient(80% 80% at 100% 0%, rgba(244,114,182,0.10) 0%, transparent 60%)",
  },
  site: {
    label: "Сайт",
    icon: Globe,
    gradient:
      "radial-gradient(80% 80% at 100% 0%, rgba(168,255,87,0.10) 0%, transparent 60%)",
  },
};

const PREPARING_MS = 30_000;

export function ProjectCard({ project }: Props) {
  const meta = KIND_META[project.kind];
  const Icon = meta.icon;

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-xl p-5 transition-colors"
      style={{
        background: `${meta.gradient}, #1a1a1a`,
        border: "1px solid #2a2a2a",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid #2a2a2a",
              color: "rgba(255,255,255,0.85)",
            }}
            aria-hidden
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <div
              className="text-[11px] font-medium uppercase tracking-wide"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              {meta.label}
            </div>
            <div className="mt-0.5 line-clamp-1 font-display text-[15px] font-semibold text-white">
              {project.name}
            </div>
          </div>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {/* Body */}
      <div className="mt-4 flex-1">
        {project.status === "preparing" ? (
          <PreparingBody createdAt={project.createdAt} />
        ) : project.status === "ready" ? (
          <ReadyBody project={project} />
        ) : (
          <p
            className="text-xs"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            Черновик. Завершите бриф, чтобы запустить проект.
          </p>
        )}
      </div>

      {/* Footer CTA */}
      <div className="mt-4 toolbar-row">
        <span
          className="text-[11px] tabular-nums"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          Создан {formatDate(project.createdAt)}
        </span>
        <Link
          to="/projects/$projectId"
          params={{ projectId: project.id }}
          className="inline-flex items-center gap-1 text-xs font-semibold transition-transform group-hover:translate-x-0.5"
          style={{ color: project.status === "ready" ? "#a8ff57" : "rgba(255,255,255,0.65)" }}
          aria-label={`Открыть проект ${project.name}`}
        >
          {project.status === "ready" ? "Открыть" : "Подробнее"}
          <ArrowRight className="h-3 w-3" strokeWidth={2} />
        </Link>
      </div>
    </article>
  );
}

/* ───── Status badge ───── */

function StatusBadge({ status }: { status: Project["status"] }) {
  if (status === "ready") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
        style={{
          background: "rgba(168,255,87,0.12)",
          color: "#a8ff57",
          border: "1px solid rgba(168,255,87,0.25)",
        }}
      >
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: "#a8ff57" }}
        />
        Готов
      </span>
    );
  }
  if (status === "preparing") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
        style={{
          background: "rgba(251,191,36,0.10)",
          color: "#fbbf24",
          border: "1px solid rgba(251,191,36,0.25)",
        }}
      >
        <Loader2 className="h-2.5 w-2.5 animate-spin" strokeWidth={2.5} />
        Готовится
      </span>
    );
  }
  if (status === "paused") {
    return (
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
        style={{
          background: "rgba(255,255,255,0.05)",
          color: "rgba(255,255,255,0.55)",
          border: "1px solid #2a2a2a",
        }}
      >
        На паузе
      </span>
    );
  }
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{
        background: "rgba(255,255,255,0.05)",
        color: "rgba(255,255,255,0.55)",
        border: "1px solid #2a2a2a",
      }}
    >
      Черновик
    </span>
  );
}

/* ───── Preparing body ───── */

function PreparingBody({ createdAt }: { createdAt: string }) {
  const [pct, setPct] = useState(() => clampPct(createdAt));
  useEffect(() => {
    if (pct >= 100) return;
    const id = setInterval(() => setPct(clampPct(createdAt)), 500);
    return () => clearInterval(id);
  }, [createdAt, pct]);

  return (
    <div className="space-y-2">
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
        Настраиваем проект под ваш бриф. Обычно занимает ~30 секунд.
      </p>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-linear"
          style={{ width: `${pct}%`, background: "#a8ff57" }}
        />
      </div>
    </div>
  );
}

function clampPct(createdAt: string): number {
  const elapsed = Date.now() - new Date(createdAt).getTime();
  return Math.min(100, Math.max(5, Math.round((elapsed / PREPARING_MS) * 100)));
}

/* ───── Ready body — kind-specific stats ───── */

function ReadyBody({ project }: { project: Project }) {
  const stats = project.stats ?? {};
  if (project.kind === "assistant") {
    return (
      <StatsGrid
        items={[
          { label: "Лидов", value: stats.leadsCount ?? 0, accent: true },
          { label: "Диалогов", value: stats.conversationsCount ?? 0 },
          { label: "Ответ за", value: `${stats.avgResponseSec ?? 0}c` },
        ]}
      />
    );
  }
  if (project.kind === "media") {
    return (
      <StatsGrid
        items={[
          { label: "Постов", value: stats.postsGenerated ?? 0, accent: true },
          { label: "В плане", value: stats.postsScheduled ?? 0 },
          { label: "Охват", value: formatNum(stats.totalReach ?? 0) },
        ]}
      />
    );
  }
  return (
    <StatsGrid
      items={[
        { label: "Заявок", value: stats.formSubmits ?? 0, accent: true },
        { label: "Просмотров", value: formatNum(stats.pageViews ?? 0) },
        { label: "На стр.", value: `${stats.avgTimeOnPageSec ?? 0}c` },
      ]}
    />
  );
}

function StatsGrid({
  items,
}: {
  items: { label: string; value: number | string; accent?: boolean }[];
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-md px-2.5 py-2"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #2a2a2a" }}
        >
          <div
            className="text-[10px] uppercase tracking-wide"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            {it.label}
          </div>
          <div
            className="mt-0.5 font-display text-lg font-semibold tabular-nums leading-none"
            style={{ color: it.accent ? "#a8ff57" : "#ffffff" }}
          >
            {it.value}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───── helpers ───── */

function formatNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}
