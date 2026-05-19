import { isRealAuthEnabled } from "@/lib/auth/config";
import type { User } from "@/types/entities";

export type DataPersistenceMode = "api" | "session";

/** Product UI uses PostgreSQL APIs when real auth + tenant are present. */
export function resolveProductDataSource(
  envMode: DataPersistenceMode,
  user: User | null | undefined,
): DataPersistenceMode {
  if (!isRealAuthEnabled()) return "session";
  if (!user?.tenantId) return "session";
  if (envMode === "session") return "session";
  return "api";
}

export function isProductApiMode(
  envMode: DataPersistenceMode,
  user: User | null | undefined,
): boolean {
  return resolveProductDataSource(envMode, user) === "api";
}
