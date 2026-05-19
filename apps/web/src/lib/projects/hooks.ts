/**
 * Hooks для проектов кабинета.
 * Привязаны к текущему юзеру из qk.auth.currentUser cache.
 *
 * Persistence:
 * - `VITE_PROJECTS_DATA_SOURCE=api` + real auth + tenantId → `/api/v1/projects`
 * - иначе → sessionStorage (legacy)
 *
 * createFromBrief — создаёт project в status="preparing"; через ~30s `usePreparingPromoter`
 * переводит в "ready" с mock-stats (как и раньше).
 */
import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { qk } from "@/lib/query-keys";
import type { User } from "@/types/entities";
import type { Project, ProjectKind, ProjectStats } from "./types";
import { resolveProjectsPersistence } from "./config";
import { dtoToProject } from "./map-dto";
import {
  deleteProject as deleteFromStore,
  getProject,
  listProjectsByUser,
  saveProject,
  updateProject as updateInStore,
} from "./store";

function tenantQueryKey(user: User | null | undefined): string {
  return user?.tenantId ?? "local";
}

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

function projectsQueriesEnabled(userId: string | undefined): boolean {
  return !!userId && typeof window !== "undefined";
}

export function useProjects() {
  const { data: user } = useQuery<User | null>({ queryKey: qk.auth.currentUser });
  const userId = user?.id;
  const tenantKey = tenantQueryKey(user);
  const persistence = resolveProjectsPersistence(user);

  return useQuery({
    queryKey: qk.projects.list(tenantKey, userId ?? "anon"),
    queryFn: async () => {
      if (!userId) return [];
      if (persistence === "session") return listProjectsByUser(userId);
      const res = await apiClient.listProjects({ page: 1, pageSize: 100 });
      return res.items.map(dtoToProject);
    },
    enabled: projectsQueriesEnabled(userId),
    staleTime: 5_000,
  });
}

export function useProject(id: string | undefined) {
  const { data: user } = useQuery<User | null>({ queryKey: qk.auth.currentUser });
  const userId = user?.id;
  const tenantKey = tenantQueryKey(user);
  const persistence = resolveProjectsPersistence(user);

  return useQuery({
    queryKey: qk.projects.detail(tenantKey, userId ?? "anon", id ?? ""),
    queryFn: async () => {
      if (!userId || !id) return null;
      if (persistence === "session") return getProject(userId, id);
      const dto = await apiClient.getProject(id);
      return dtoToProject(dto);
    },
    enabled: projectsQueriesEnabled(userId) && !!id,
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
  const tenantKey = tenantQueryKey(user);
  const persistence = resolveProjectsPersistence(user);
  const { data: projects } = useProjects();
  const [armed] = useState(() => new Set<string>());

  useEffect(() => {
    if (!userId || !projects) return;
    const timers: number[] = [];
    for (const p of projects) {
      if (p.status !== "preparing" || armed.has(p.id)) continue;
      armed.add(p.id);
      const elapsed = Date.now() - new Date(p.createdAt).getTime();
      const wait = Math.max(0, PREPARING_DURATION_MS - elapsed);
      timers.push(
        window.setTimeout(async () => {
          const stats = generateMockStats(p.kind, p.briefData);
          try {
            if (persistence === "session") {
              updateInStore(userId, p.id, {
                status: "ready",
                readyAt: new Date().toISOString(),
                stats,
              });
            } else {
              await apiClient.patchProject(p.id, {
                status: "ready",
                readyAt: new Date().toISOString(),
                stats: stats as Record<string, unknown>,
              });
            }
            await qc.invalidateQueries({ queryKey: qk.projects.list(tenantKey, userId) });
            await qc.invalidateQueries({
              queryKey: qk.projects.detail(tenantKey, userId, p.id),
            });
          } catch {
            armed.delete(p.id);
          }
        }, wait),
      );
    }
    return () => {
      for (const t of timers) window.clearTimeout(t);
    };
  }, [userId, projects, qc, armed, persistence, tenantKey]);
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
      const tenantKey = tenantQueryKey(u);
      const persistence = resolveProjectsPersistence(u);

      if (persistence === "session") {
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
        await qc.invalidateQueries({ queryKey: qk.projects.list(tenantKey, u.id) });
        return project.id;
      }

      const dto = await apiClient.createProject({ kind, briefData });
      await qc.invalidateQueries({ queryKey: qk.projects.list(tenantKey, u.id) });
      return dto.id;
    },
    [user, qc],
  );
}

export function usePatchProject() {
  const qc = useQueryClient();
  const { data: user } = useQuery<User | null>({ queryKey: qk.auth.currentUser });

  return useCallback(
    async (projectId: string, patch: Partial<Project>) => {
      const userId = user?.id;
      if (!userId) throw new Error("No user");
      const tenantKey = tenantQueryKey(user);
      const persistence = resolveProjectsPersistence(user);

      if (persistence === "session") {
        updateInStore(userId, projectId, patch);
      } else {
        await apiClient.patchProject(projectId, {
          ...(patch.name !== undefined ? { name: patch.name } : {}),
          ...(patch.status !== undefined ? { status: patch.status } : {}),
          ...(patch.briefData !== undefined ? { briefData: patch.briefData } : {}),
          ...(patch.stats !== undefined ? { stats: patch.stats as Record<string, unknown> | null } : {}),
          ...(patch.readyAt !== undefined ? { readyAt: patch.readyAt ?? null } : {}),
        });
      }

      await qc.invalidateQueries({ queryKey: qk.projects.list(tenantKey, userId) });
      await qc.invalidateQueries({
        queryKey: qk.projects.detail(tenantKey, userId, projectId),
      });
    },
    [user, qc],
  );
}

export function useDeleteProject() {
  const qc = useQueryClient();
  const { data: user } = useQuery<User | null>({ queryKey: qk.auth.currentUser });

  return useCallback(
    async (id: string) => {
      if (!user?.id) return;
      const tenantKey = tenantQueryKey(user);
      const persistence = resolveProjectsPersistence(user);

      if (persistence === "session") {
        deleteFromStore(user.id, id);
      } else {
        await apiClient.archiveProject(id);
      }

      await qc.invalidateQueries({ queryKey: qk.projects.list(tenantKey, user.id) });
      await qc.removeQueries({
        queryKey: qk.projects.detail(tenantKey, user.id, id),
      });
    },
    [user, qc],
  );
}
