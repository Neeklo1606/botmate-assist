import { resolveProductDataSource, type DataPersistenceMode } from "@/lib/data-source";
import type { User } from "@/types/entities";

export type LeadsPersistenceMode = DataPersistenceMode;

export function readLeadsPersistenceEnv(): LeadsPersistenceMode {
  const raw = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_LEADS_DATA_SOURCE;
  return raw === "session" ? "session" : "api";
}

export function resolveLeadsPersistence(user: User | null | undefined): LeadsPersistenceMode {
  return resolveProductDataSource(readLeadsPersistenceEnv(), user);
}
