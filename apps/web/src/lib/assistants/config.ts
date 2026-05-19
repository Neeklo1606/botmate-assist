import { resolveProductDataSource, type DataPersistenceMode } from "@/lib/data-source";
import type { User } from "@/types/entities";

export type AssistantsPersistenceMode = DataPersistenceMode;

export function readAssistantsPersistenceEnv(): AssistantsPersistenceMode {
  const raw = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_ASSISTANTS_DATA_SOURCE;
  return raw === "session" ? "session" : "api";
}

export function resolveAssistantsPersistence(user: User | null | undefined): AssistantsPersistenceMode {
  return resolveProductDataSource(readAssistantsPersistenceEnv(), user);
}
