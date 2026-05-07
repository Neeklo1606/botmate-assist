/**
 * Projects sessionStorage wrapper. Ключ: botme:projects:${userId}.
 * SSR-safe.
 */
import type { Project } from "./types";

const key = (userId: string) => `botme:projects:${userId}`;

function safe(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function readAll(userId: string): Record<string, Project> {
  const s = safe();
  if (!s) return {};
  try {
    const raw = s.getItem(key(userId));
    return raw ? (JSON.parse(raw) as Record<string, Project>) : {};
  } catch {
    return {};
  }
}

function writeAll(userId: string, projects: Record<string, Project>): void {
  const s = safe();
  if (!s) return;
  try {
    s.setItem(key(userId), JSON.stringify(projects));
  } catch {
    /* noop */
  }
}

export function listProjectsByUser(userId: string): Project[] {
  return Object.values(readAll(userId)).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getProject(userId: string, id: string): Project | null {
  return readAll(userId)[id] ?? null;
}

export function saveProject(project: Project): void {
  const all = readAll(project.userId);
  all[project.id] = project;
  writeAll(project.userId, all);
}

export function updateProject(
  userId: string,
  id: string,
  patch: Partial<Project>,
): Project | null {
  const all = readAll(userId);
  const cur = all[id];
  if (!cur) return null;
  const next = { ...cur, ...patch, updatedAt: new Date().toISOString() };
  all[id] = next;
  writeAll(userId, all);
  return next;
}

export function deleteProject(userId: string, id: string): void {
  const all = readAll(userId);
  delete all[id];
  writeAll(userId, all);
}
