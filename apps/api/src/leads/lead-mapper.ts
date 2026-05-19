import type { LeadDto } from "@botmate/shared";
import type { LeadRow } from "./lead-repository.js";

function asObj(raw: unknown): Record<string, unknown> {
  if (raw !== null && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

export function fallbackLeadDisplayNumber(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return 10000 + (h % 90000);
}

export function shallowMergeJson(prev: unknown, patch: Record<string, unknown>): Record<string, unknown> {
  const base = asObj(prev);
  const merged = { ...base };
  const patchCrm = asObj(patch.crm);
  if (Object.keys(patchCrm).length > 0) {
    merged.crm = { ...asObj(base.crm), ...patchCrm };
  }
  for (const [k, v] of Object.entries(patch)) {
    if (k === "crm") continue;
    merged[k] = v;
  }
  return merged;
}

export function mergeAttribution(prev: unknown, patch: Record<string, unknown>): Record<string, unknown> {
  return { ...asObj(prev), ...patch };
}

export function leadDtoFromRow(row: LeadRow, ownerName?: string | null): LeadDto {
  const attribution =
    row.attribution != null && typeof row.attribution === "object" && !Array.isArray(row.attribution)
      ? (row.attribution as Record<string, unknown>)
      : undefined;
  const meta =
    row.metadata != null && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : undefined;

  const dto: LeadDto = {
    id: row.id,
    tenantId: row.tenantId,
    assistantId: row.assistantId ?? undefined,
    projectId: row.projectId ?? undefined,
    sessionId: row.sessionId ?? undefined,
    ownerUserId: row.ownerUserId ?? undefined,
    ownerName: ownerName ?? undefined,
    name: row.name,
    contact: row.contact,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    summary: row.summary,
    interest: row.interest,
    source: row.source,
    pipelineStatus: row.pipelineStatus,
    displayNumber: fallbackLeadDisplayNumber(row.id),
    attribution,
    metadata: meta,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
  return dto;
}
