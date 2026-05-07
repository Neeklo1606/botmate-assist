/**
 * /app/projects — список всех проектов пользователя.
 *
 * Простая сетка ProjectCard'ов + фильтр по типу. Точка входа в детальные страницы.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Bot, Sparkles, Globe, Filter } from "lucide-react";
import { useProjects, usePreparingPromoter } from "@/lib/projects/hooks";
import { ProjectCard } from "@/components/app/dashboard/ProjectCard";
import type { ProjectKind } from "@/lib/projects/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/projects")({
  head: () => ({ meta: [{ title: "Проекты — botme" }] }),
  component: ProjectsListPage,
});

type FilterValue = "all" | ProjectKind;

const FILTERS: { value: FilterValue; label: string; icon?: typeof Bot }[] = [
  { value: "all", label: "Все" },
  { value: "assistant", label: "Ассистенты", icon: Bot },
  { value: "media", label: "Медиа", icon: Sparkles },
  { value: "site", label: "Сайты", icon: Globe },
];

function ProjectsListPage() {
  usePreparingPromoter();
  const { data: projects, isLoading } = useProjects();
  const [filter, setFilter] = useState<FilterValue>("all");

  const filtered = useMemo(() => {
    if (!projects) return [];
    if (filter === "all") return projects;
    return projects.filter((p) => p.kind === filter);
  }, [projects, filter]);

  return (
    <div className="space-y-5 text-white">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-white">
            Проекты
          </h1>
          <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
            Все ваши ассистенты, медиа-студии и лендинги в одном месте.
          </p>
        </div>
        <Link
          to="/onboarding/assistant"
          className="inline-flex h-10 items-center gap-1.5 rounded-md px-4 text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: "#a8ff57", color: "#0a0a0a" }}
        >
          <Plus className="h-4 w-4" strokeWidth={2.25} />
          Новый проект
        </Link>
      </header>

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />
        {FILTERS.map((f) => {
          const active = filter === f.value;
          const Icon = f.icon;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors",
              )}
              style={{
                background: active ? "rgba(168,255,87,0.12)" : "rgba(255,255,255,0.04)",
                color: active ? "#a8ff57" : "rgba(255,255,255,0.7)",
                border: active
                  ? "1px solid rgba(168,255,87,0.35)"
                  : "1px solid #2a2a2a",
              }}
            >
              {Icon && <Icon className="h-3 w-3" strokeWidth={2} />}
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {isLoading ? (
        <SkeletonGrid />
      ) : filtered.length === 0 ? (
        <EmptyState filter={filter} hasAny={!!projects && projects.length > 0} />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-44 animate-pulse rounded-xl"
          style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
        />
      ))}
    </div>
  );
}

function EmptyState({ filter, hasAny }: { filter: FilterValue; hasAny: boolean }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-xl px-6 py-12 text-center"
      style={{ background: "#1a1a1a", border: "1px dashed #2a2a2a" }}
    >
      <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
        {hasAny && filter !== "all"
          ? "В этом разделе пока нет проектов."
          : "У вас ещё нет проектов. Начните с любого продукта — это занимает 5–7 минут."}
      </p>
      {!hasAny && (
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Link
            to="/onboarding/assistant"
            className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-opacity hover:opacity-90"
            style={{ background: "#a8ff57", color: "#0a0a0a" }}
          >
            <Bot className="h-3.5 w-3.5" strokeWidth={2} />
            Ассистент
          </Link>
          <Link
            to="/onboarding/media"
            className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-white transition-colors hover:bg-white/10"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #2a2a2a" }}
          >
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
            Медиа
          </Link>
          <Link
            to="/onboarding/site"
            className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-white transition-colors hover:bg-white/10"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #2a2a2a" }}
          >
            <Globe className="h-3.5 w-3.5" strokeWidth={2} />
            Сайт
          </Link>
        </div>
      )}
    </div>
  );
}
