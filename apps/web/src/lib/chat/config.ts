import { resolveProductDataSource, type DataPersistenceMode } from "@/lib/data-source";
import type { User } from "@/types/entities";

export type ChatPersistenceMode = DataPersistenceMode;

export function readChatPersistenceEnv(): ChatPersistenceMode {
  const raw = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_CHAT_DATA_SOURCE;
  return raw === "session" ? "session" : "api";
}

export function resolveChatPersistence(user: User | null | undefined): ChatPersistenceMode {
  return resolveProductDataSource(readChatPersistenceEnv(), user);
}
