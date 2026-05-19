/**
 * /app/projects/$projectId — детальная страница проекта.
 *
 * Tabs: Обзор / Бриф / Настройки.
 * Состояния:
 *  - preparing: показываем единый "Готовится" блок с прогрессом, без табов.
 *  - ready: kind-specific Overview + BriefView + Settings.
 *  - not found: 404.
 */
import { useState } from "react";
import {
  createFileRoute,
  Link,
  useNavigate,
  notFound,
} from "@tanstack/react-router";
import {
  ArrowLeft,
  Bot,
  Sparkles,
  Globe,
  Loader2,
  Pause,
  Play,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useProject,
  useDeleteProject,
  usePreparingPromoter,
  usePatchProject,
} from "@/lib/projects/hooks";
import { useCurrentUser } from "@/lib/hooks/use-auth";
import type { Project, ProjectKind } from "@/lib/projects/types";
import { AssistantOverview } from "@/components/app/projects/AssistantOverview";
import { MediaOverview } from "@/components/app/projects/MediaOverview";
import { SiteOverview } from "@/components/app/projects/SiteOverview";
import { BriefView } from "@/components/app/projects/BriefView";

export const Route = createFileRoute("/_app/projects/$projectId")({
  head: () => ({ meta: [{ title: "Проект — botme" }] }),
  component: ProjectDetailPage,
  notFoundComponent: () => (
    <div className="text-white">
      <h1 className="font-display text-xl font-semibold">Проект не найден</h1>
      <Link to="/projects" className="mt-3 inline-block text-sm" style={{ color: "#a8ff57" }}>
        ← К списку проектов
      </Link>
    </div>
  ),
});

const KIND_META: Record<ProjectKind, { label: string; icon: typeof Bot }> = {
  assistant: { label: "Ассистент", icon: Bot },
  media: { label: "Медиа-студия", icon: Sparkles },
  site: { label: "Сайт", icon: Globe },
};

function ProjectDetailPage() {
  const { projectId } = Route.useParams();
  usePreparingPromoter();
  const { data: project, isLoading } = useProject(projectId);

  if (isLoading) {
    return (
      <div className="text-white">
        <div className="h-44 animate-pulse rounded-xl" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }} />
      </div>
    );
  }

  if (!project) throw notFound();

  return <Detail project={project} />;
}

function Detail({ project }: { project: Project }) {
  const meta = KIND_META[project.kind];
  const Icon = meta.icon;

  return (
    <div className="space-y-5 text-white">
      {/* Top bar */}
      <Link
        to="/projects"
        className="inline-flex items-center gap-1 text-sm transition-colors hover:text-white"
        style={{ color: "rgba(255,255,255,0.6)" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Все проекты
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: "rgba(168,255,87,0.10)", border: "1px solid rgba(168,255,87,0.25)", color: "#a8ff57" }}
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>
              {meta.label}
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-white">
              {project.name}
            </h1>
          </div>
        </div>
        <StatusBadge status={project.status} />
      </header>

      {project.status === "preparing" ? (
        <PreparingState project={project} />
      ) : (
        <Tabs defaultValue="overview">
          <TabsList className="bg-[#1a1a1a] border border-[#2a2a2a]">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white">Обзор</TabsTrigger>
            <TabsTrigger value="brief"    className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white">Бриф</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white">Настройки</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-5">
            {project.kind === "assistant" && <AssistantOverview project={project} />}
            {project.kind === "media" && <MediaOverview project={project} />}
            {project.kind === "site" && <SiteOverview project={project} />}
          </TabsContent>
          <TabsContent value="brief" className="mt-5">
            <BriefView project={project} />
          </TabsContent>
          <TabsContent value="settings" className="mt-5">
            <ProjectSettings project={project} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

/* ───── Preparing ───── */

function PreparingState({ project }: { project: Project }) {
  const elapsed = Date.now() - new Date(project.createdAt).getTime();
  const pct = Math.min(100, Math.max(5, Math.round((elapsed / 30_000) * 100)));
  return (
    <section
      className="rounded-xl p-8 text-center"
      style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.25)" }}>
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#fbbf24" }} strokeWidth={2} />
      </div>
      <h2 className="mt-4 font-display text-lg font-semibold text-white">Проект готовится</h2>
      <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
        Настраиваем под ваш бриф. Обычно занимает ~30 секунд. Можно закрыть страницу — мы пришлём уведомление.
      </p>
      <div className="mx-auto mt-5 h-1.5 w-full max-w-md overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full transition-[width] duration-500 ease-linear" style={{ width: `${pct}%`, background: "#a8ff57" }} />
      </div>
    </section>
  );
}

/* ───── Status badge ───── */

function StatusBadge({ status }: { status: Project["status"] }) {
  if (status === "ready") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
        style={{ background: "rgba(168,255,87,0.12)", color: "#a8ff57", border: "1px solid rgba(168,255,87,0.25)" }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#a8ff57" }} />
        Готов и работает
      </span>
    );
  }
  if (status === "preparing") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
        style={{ background: "rgba(251,191,36,0.10)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }}>
        <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.25} />
        Готовится
      </span>
    );
  }
  if (status === "paused") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
        style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid #2a2a2a" }}>
        На паузе
      </span>
    );
  }
  return null;
}

/* ───── Settings tab ───── */

function ProjectSettings({ project }: { project: Project }) {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const deleteProject = useDeleteProject();
  const patchProject = usePatchProject();
  const [busy, setBusy] = useState(false);

  const togglePause = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const next = project.status === "paused" ? "ready" : "paused";
      await patchProject(project.id, { status: next });
      toast.success(next === "paused" ? "Проект поставлен на паузу" : "Проект снова активен");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    await deleteProject(project.id);
    toast.success("Проект удалён");
    navigate({ to: "/projects" });
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl p-5" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
        <h3 className="font-display text-base font-semibold text-white">Состояние</h3>
        <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
          {project.status === "paused"
            ? "Проект на паузе — все каналы и публикации остановлены."
            : "Проект активен. Можно временно поставить на паузу — это не удаляет данные."}
        </p>
        <button
          type="button"
          onClick={togglePause}
          disabled={busy || project.status === "preparing"}
          className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-md px-4 text-sm font-semibold transition-colors disabled:opacity-50"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #2a2a2a", color: "#ffffff" }}
        >
          {project.status === "paused" ? (
            <>
              <Play className="h-3.5 w-3.5" strokeWidth={2} /> Возобновить
            </>
          ) : (
            <>
              <Pause className="h-3.5 w-3.5" strokeWidth={2} /> Поставить на паузу
            </>
          )}
        </button>
      </section>

      <section className="rounded-xl p-5" style={{ background: "#1a1a1a", border: "1px solid rgba(239,68,68,0.30)" }}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 flex-none" style={{ color: "#ef4444" }} strokeWidth={2} />
          <div>
            <h3 className="font-display text-base font-semibold text-white">Удалить проект</h3>
            <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              Действие необратимо. Все данные брифа и статистика будут удалены.
            </p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-md px-4 text-sm font-semibold transition-colors"
              style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.35)", color: "#ef4444" }}
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
              Удалить проект
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить «{project.name}»?</AlertDialogTitle>
              <AlertDialogDescription>
                Действие необратимо. Все данные брифа и статистика будут удалены навсегда.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}
