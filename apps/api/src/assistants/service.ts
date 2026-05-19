import { Prisma } from "@prisma/client";
import {
  AssistantDtoSchema,
  ChannelIdSchema,
  type AssistantChannelId,
  type AssistantDto,
  type CreateAssistantBody,
  type PatchAssistantBody,
} from "@botmate/shared";
import { prisma } from "@botmate/database";
import { MILESTONE_DEDUPE, recordProductEventFireAndForget } from "@botmate/runtime";
import type { AuthContext } from "../auth.js";
import { emitAssistantUpdated } from "../realtime/workspace-events.js";
import {
  archiveAssistantRow,
  assertProjectBelongsToTenant,
  countActiveAssistantsByTenant,
  createAssistantRow,
  findActiveAssistantByIdForTenant,
  listActiveAssistantsByTenant,
  updateAssistantRow,
  type AssistantRow,
} from "./repository.js";

function asSettingsObject(raw: unknown): Record<string, unknown> {
  if (raw !== null && typeof raw === "object" && !Array.isArray(raw)) {
    return { ...(raw as Record<string, unknown>) };
  }
  return {};
}

function parseChannels(raw: unknown): AssistantChannelId[] {
  if (!Array.isArray(raw)) return [];
  const out: AssistantChannelId[] = [];
  for (const item of raw) {
    const parsed = ChannelIdSchema.safeParse(item);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}

function parseMetrics(raw: unknown): {
  conversations7d: number;
  leads7d: number;
  conversion: number;
} {
  const m = raw !== null && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const conversations7d =
    typeof m.conversations7d === "number" && Number.isFinite(m.conversations7d)
      ? Math.max(0, Math.floor(m.conversations7d))
      : 0;
  const leads7d =
    typeof m.leads7d === "number" && Number.isFinite(m.leads7d) ? Math.max(0, Math.floor(m.leads7d)) : 0;
  let conversion = typeof m.conversion === "number" && Number.isFinite(m.conversion) ? m.conversion : 0;
  conversion = Math.min(1, Math.max(0, conversion));
  return { conversations7d, leads7d, conversion };
}

/** Wire DTO exposes list/overview fields only — never serialized prompt/tools blobs (see ASSISTANT_SETTINGS_MODEL.md). */
export function assistantRowToDto(row: AssistantRow): AssistantDto {
  const settings = asSettingsObject(row.settings);
  const channels = parseChannels(settings.channels);
  const metrics = parseMetrics(settings.metrics);

  return AssistantDtoSchema.parse({
    id: row.id,
    name: row.name,
    niche: row.niche,
    status: row.status,
    channels,
    conversations7d: metrics.conversations7d,
    leads7d: metrics.leads7d,
    conversion: metrics.conversion,
    updatedAt: row.updatedAt.toISOString(),
    projectId: row.projectId ?? undefined,
  });
}

export function defaultAssistantSettings(body: CreateAssistantBody): Prisma.InputJsonValue {
  return {
    channels: body.channels ?? [],
    metrics: {
      conversations7d: 0,
      leads7d: 0,
      conversion: 0,
    },
    tools: { enabled: [] as string[], config: {} },
    ai: { provider: "openai" },
    model: { id: "gpt-4o-mini", temperature: 0.7 },
    prompt: { system: "", userTemplate: "" },
  };
}

function mergeAssistantSettingsJson(prev: unknown, patch: PatchAssistantBody): Prisma.InputJsonValue {
  const s = asSettingsObject(prev);

  if (patch.channels !== undefined) {
    s.channels = patch.channels;
  }

  const metrics = parseMetrics(s.metrics);
  let metricsTouched = false;
  if (patch.conversations7d !== undefined) {
    metrics.conversations7d = patch.conversations7d;
    metricsTouched = true;
  }
  if (patch.leads7d !== undefined) {
    metrics.leads7d = patch.leads7d;
    metricsTouched = true;
  }
  if (patch.conversion !== undefined) {
    metrics.conversion = patch.conversion;
    metricsTouched = true;
  }
  if (metricsTouched) {
    s.metrics = metrics;
  }

  if (patch.settings !== undefined) {
    for (const [k, v] of Object.entries(patch.settings)) {
      if (v === undefined) continue;
      if (k === "metrics" && v !== null && typeof v === "object" && !Array.isArray(v)) {
        s.metrics = parseMetrics({
          ...asSettingsObject(s.metrics),
          ...(v as Record<string, unknown>),
        });
        continue;
      }
      s[k] = v;
    }
  }

  return s as Prisma.InputJsonValue;
}

export async function listAssistantsService(
  auth: AuthContext,
  params: { page: number; pageSize: number },
): Promise<{
  items: AssistantDto[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}> {
  const total = await countActiveAssistantsByTenant(auth.tenantId);
  const skip = (params.page - 1) * params.pageSize;
  const rows = await listActiveAssistantsByTenant(auth.tenantId, { skip, take: params.pageSize });
  const totalPages = total === 0 ? 0 : Math.ceil(total / params.pageSize);
  return {
    items: rows.map(assistantRowToDto),
    meta: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages,
    },
  };
}

export async function createAssistantService(auth: AuthContext, body: CreateAssistantBody): Promise<AssistantDto> {
  const { assertCanCreateAssistant, PlanLimitError, TenantOperationalError } = await import("@botmate/runtime");
  try {
    await assertCanCreateAssistant(prisma, auth.tenantId);
  } catch (e) {
    if (e instanceof PlanLimitError || e instanceof TenantOperationalError) throw e;
    throw e;
  }

  let projectId: string | null = null;
  if (body.projectId?.trim()) {
    const ok = await assertProjectBelongsToTenant(auth.tenantId, body.projectId.trim());
    if (!ok) throw new Error("PROJECT_NOT_FOUND");
    projectId = body.projectId.trim();
  }

  const row = await createAssistantRow({
    tenantId: auth.tenantId,
    ownerUserId: auth.userId,
    projectId,
    name: body.name.trim(),
    niche: body.niche,
    status: "draft",
    settings: defaultAssistantSettings(body),
  });
  const dto = assistantRowToDto(row);
  emitAssistantUpdated(auth.tenantId, dto.id, { reason: "created" });
  recordProductEventFireAndForget({
    prisma,
    tenantId: auth.tenantId,
    userId: auth.userId,
    name: "activation.first_assistant_created",
    dedupeKey: MILESTONE_DEDUPE.firstAssistant,
  });
  return dto;
}

export async function getAssistantService(auth: AuthContext, id: string): Promise<AssistantDto | null> {
  const row = await findActiveAssistantByIdForTenant(id, auth.tenantId);
  return row ? assistantRowToDto(row) : null;
}

export async function patchAssistantService(
  auth: AuthContext,
  id: string,
  body: PatchAssistantBody,
): Promise<AssistantDto | null> {
  const existing = await findActiveAssistantByIdForTenant(id, auth.tenantId);
  if (!existing) return null;

  let nextProjectId: string | null | undefined = undefined;
  if (body.projectId !== undefined) {
    if (body.projectId === null) {
      nextProjectId = null;
    } else {
      const ok = await assertProjectBelongsToTenant(auth.tenantId, body.projectId.trim());
      if (!ok) throw new Error("PROJECT_NOT_FOUND");
      nextProjectId = body.projectId.trim();
    }
  }

  const needsSettingsMerge =
    body.channels !== undefined ||
    body.conversations7d !== undefined ||
    body.leads7d !== undefined ||
    body.conversion !== undefined ||
    body.settings !== undefined;

  const nextSettings = needsSettingsMerge ? mergeAssistantSettingsJson(existing.settings, body) : undefined;

  const prismaPatch: Parameters<typeof updateAssistantRow>[2] = {};
  if (body.name !== undefined) prismaPatch.name = body.name.trim();
  if (body.niche !== undefined) prismaPatch.niche = body.niche;
  if (body.status !== undefined) prismaPatch.status = body.status;
  if (nextProjectId !== undefined) prismaPatch.projectId = nextProjectId;
  if (nextSettings !== undefined) prismaPatch.settings = nextSettings;

  const hasDbUpdates =
    prismaPatch.name !== undefined ||
    prismaPatch.niche !== undefined ||
    prismaPatch.status !== undefined ||
    prismaPatch.projectId !== undefined ||
    prismaPatch.settings !== undefined;

  if (!hasDbUpdates) {
    return assistantRowToDto(existing);
  }

  const row = await updateAssistantRow(id, auth.tenantId, prismaPatch);
  const dto = row ? assistantRowToDto(row) : null;
  if (dto) emitAssistantUpdated(auth.tenantId, dto.id, { reason: "patched" });
  return dto;
}

export async function archiveAssistantService(auth: AuthContext, id: string): Promise<boolean> {
  const ok = await archiveAssistantRow(id, auth.tenantId);
  if (ok) emitAssistantUpdated(auth.tenantId, id, { archived: true });
  return ok;
}
