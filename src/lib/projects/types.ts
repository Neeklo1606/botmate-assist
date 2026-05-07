/**
 * Projects domain — каждый бриф превращается в Project, который видится в /app.
 * Хранение: sessionStorage per-user. SSR-safe.
 */
export type ProjectKind = "assistant" | "media" | "site";

export type ProjectStatus = "draft" | "preparing" | "ready" | "paused";

export interface ProjectStats {
  views?: number;
  leadsCount?: number;
  conversationsCount?: number;
  avgResponseSec?: number;
  satisfactionPct?: number;
  postsGenerated?: number;
  postsScheduled?: number;
  totalReach?: number;
  pageViews?: number;
  formSubmits?: number;
  avgTimeOnPageSec?: number;
}

export interface Project {
  id: string;
  userId: string;
  kind: ProjectKind;
  name: string;
  status: ProjectStatus;
  briefData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  readyAt?: string;
  stats?: ProjectStats;
}
