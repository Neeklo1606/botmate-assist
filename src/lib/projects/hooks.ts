/**
 * Hooks для проектов кабинета.
 * Привязаны к текущему юзеру из qk.auth.currentUser cache.
 *
 * createFromBrief — создаёт project в status="preparing", через 30s
 * автоматически переводит в "ready" с mock-stats.
 *
 * TODO: replace with real API — POST /api/projects, GET /api/projects.
 */
import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import type { User } from "@/types/entities";
import type { Project, ProjectKind, ProjectStats } from "./types";
import {
  deleteProject as deleteFromStore,
  getProject,
  listProjectsByUser,
  saveProject,
  updateProject as updateInStore,
} from "./store";

const projectsKey = (userId: string | undefined) =>
  ["projects", userId ?? "anon"] as const;

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `prj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMockStats(
  kind: ProjectKind,
  briefData: Record<string, unknown>,
): ProjectStats {
  if (kind === "assistant") {
    const leads = rand(12, 47);
    return {
      leadsCount: leads,
      conversationsCount: leads * rand(3, 6),
      avgResponseSec: rand(5, 15),
      satisfactionPct: rand(82, 96),
    };
  }
  if (kind === "media") {
    const freq = (briefData.frequency as string) ?? "weekly";
    const scheduledMap: Record<string, number> = {
      daily: 30,
      thrice_week: 12,
      weekly: 4,
      irregular: 8,
    };
    return {
      postsGenerated: 5,
      postsScheduled: scheduledMap[freq] ?? 8,
      totalReach: rand(1200, 8500),
    };
  }
  // site
  const views = rand(80, 500);
  return {
    pageViews: views,
    views,
    formSubmits: rand(5, 35),
    avgTimeOnPageSec: rand(45, 180),
  };
}

function buildName(kind: ProjectKind, data: Record<string, unknown>): string {
  const brand =
    (data.brandName as string) ||
    (data.companyName as string) ||
    (data.offer as string) ||
    "";
  const fallback: Record<ProjectKind, string> = {
    assistant: "Ваш ассистент",
    media: "Ваша медиа-студия",
    site: "Ваш лендинг",
  };
  if (!brand.trim()) return fallback[kind];
  const prefix: Record<ProjectKind, string> = {
    assistant: "Ассистент",
    media: "Медиа-студия",
    site: "Лендинг",
  };
  return `${prefix[kind]} · ${brand.trim().slice(0, 40)}`;
}

export function useProjects() {
  const { data: user } = useQuery<User | null>({ queryKey: qk.auth.currentUser });
  const userId = user?.id;
  return useQuery({
    queryKey: projectsKey(userId),
    queryFn: () => (userId ? listProjectsByUser(userId) : []),
    enabled: !!userId,
    staleTime: 5_000,
  });
}

export function useProject(id: string | undefined) {
  const { data: user } = useQuery<User | null>({ queryKey: qk.auth.currentUser });
  const userId = user?.id;
  return useQuery({
    queryKey: ["project", userId ?? "anon", id ?? ""] as const,
    queryFn: () => (userId && id ? getProject(userId, id) : null),
    enabled: !!userId && !!id,
    // Re-query while project is preparing — short stale time so status flips.
    refetchInterval: (query) => {
      const data = query.state.data as Project | null | undefined;
      return data && data.status === "preparing" ? 2000 : false;
    },
  });
}

const PREPARING_DURATION_MS = 30_000;

/** Промоутит preparing → ready по таймеру. Хук ставит таймер один раз для каждого id. */
export function usePreparingPromoter() {
  const qc = useQueryClient();
  const { data: user } = useQuery<User | null>({ queryKey: qk.auth.currentUser });
  const userId = user?.id;
  const { data: projects } = useProjects();
  const [armed] = useState(() => new Set<string>());

  useEffect(() => {
    if (!userId || !projects) return;
    for (const p of projects) {
      if (p.status !== "preparing" || armed.has(p.id)) continue;
      armed.add(p.id);
      const elapsed = Date.now() - new Date(p.createdAt).getTime();
      const wait = Math.max(0, PREPARING_DURATION_MS - elapsed);
      setTimeout(() => {
        updateInStore(userId, p.id, {
          status: "ready",
          readyAt: new Date().toISOString(),
          stats: generateMockStats(p.kind, p.briefData),
        });
        qc.invalidateQueries({ queryKey: projectsKey(userId) });
        qc.invalidateQueries({ queryKey: ["project", userId, p.id] });
      }, wait);
    }
  }, [userId, projects, qc, armed]);
}

export function useCreateProject() {
  const qc = useQueryClient();
  const { data: user } = useQuery<User | null>({ queryKey: qk.auth.currentUser });

  return useCallback(
    async (
      kind: ProjectKind,
      briefData: Record<string, unknown>,
      overrideUser?: User | null,
    ): Promise<string> => {
      const u = overrideUser ?? user;
      if (!u) throw new Error("No user — cannot create project");
      const now = new Date().toISOString();
      const project: Project = {
        id: uuid(),
        userId: u.id,
        kind,
        name: buildName(kind, briefData),
        status: "preparing",
        briefData,
        createdAt: now,
        updatedAt: now,
      };
      saveProject(project);

      // Promote после 30s. На refresh страницы — usePreparingPromoter подхватит.
      setTimeout(() => {
        updateInStore(u.id, project.id, {
          status: "ready",
          readyAt: new Date().toISOString(),
          stats: generateMockStats(kind, briefData),
        });
        qc.invalidateQueries({ queryKey: projectsKey(u.id) });
        qc.invalidateQueries({ queryKey: ["project", u.id, project.id] });
      }, PREPARING_DURATION_MS);

      qc.invalidateQueries({ queryKey: projectsKey(u.id) });
      return project.id;
    },
    [user, qc],
  );
}

export function useDeleteProject() {
  const qc = useQueryClient();
  const { data: user } = useQuery<User | null>({ queryKey: qk.auth.currentUser });
  return useCallback(
    (id: string) => {
      if (!user) return;
      deleteFromStore(user.id, id);
      qc.invalidateQueries({ queryKey: projectsKey(user.id) });
    },
    [user, qc],
  );
}
