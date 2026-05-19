import { resolveProductDataSource, type DataPersistenceMode } from "@/lib/data-source";
import type { User } from "@/types/entities";

export type ProjectsPersistenceMode = DataPersistenceMode;

export function readProjectsPersistenceEnv(): ProjectsPersistenceMode {
  const raw = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_PROJECTS_DATA_SOURCE;
  return raw === "session" ? "session" : "api";
}

export function resolveProjectsPersistence(user: User | null | undefined): ProjectsPersistenceMode {
  return resolveProductDataSource(readProjectsPersistenceEnv(), user);
}
