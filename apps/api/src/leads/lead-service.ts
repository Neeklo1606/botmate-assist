import { Prisma } from "@prisma/client";
import type { CreateLeadBody, LeadsListQuery, PatchLeadBody } from "@botmate/shared";
import type { AuthContext } from "../auth.js";
import { emitLeadUpdated } from "../realtime/workspace-events.js";
import { assertAssistantActiveForTenant } from "../chat/chat-repository.js";
import {
  archiveLeadRow,
  assertChatSessionForTenant,
  assertProjectActiveForTenant,
  assertUserBelongsToTenant,
  countLeadsActive,
  findLeadActiveForTenant,
  findLeadByIdempotencyKey,
  findUserFullName,
  insertLeadRow,
  listLeadsActive,
  updateLeadRow,
} from "./lead-repository.js";
import { leadDtoFromRow, mergeAttribution, shallowMergeJson } from "./lead-mapper.js";

export async function listWorkspaceLeads(auth: AuthContext, query: LeadsListQuery) {
  const whereExtra: Prisma.LeadWhereInput = {};
  if (query.pipelineStatus) whereExtra.pipelineStatus = query.pipelineStatus;
  if (query.source) whereExtra.source = query.source;
  if (query.search?.trim()) {
    const s = query.search.trim();
    whereExtra.OR = [
      { name: { contains: s, mode: "insensitive" } },
      { contact: { contains: s, mode: "insensitive" } },
      { interest: { contains: s, mode: "insensitive" } },
    ];
  }

  const total = await countLeadsActive(auth.tenantId, whereExtra);
  const skip = (query.page - 1) * query.pageSize;
  const rows = await listLeadsActive(auth.tenantId, { skip, take: query.pageSize, whereExtra });
  const totalPages = total === 0 ? 0 : Math.ceil(total / query.pageSize);

  return {
    items: rows.map((r) => leadDtoFromRow(r)),
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages,
    },
  };
}

export async function getWorkspaceLead(auth: AuthContext, leadId: string) {
  const row = await findLeadActiveForTenant(leadId, auth.tenantId);
  if (!row) return null;
  let ownerName: string | null | undefined;
  if (row.ownerUserId) {
    ownerName = await findUserFullName(auth.tenantId, row.ownerUserId);
  }
  return leadDtoFromRow(row, ownerName);
}

async function validateLeadRelations(
  tenantId: string,
  body: { assistantId?: string | null; projectId?: string | null; sessionId?: string | null; ownerUserId?: string | null },
): Promise<string | null> {
  if (body.assistantId) {
    const ok = await assertAssistantActiveForTenant(tenantId, body.assistantId);
    if (!ok) return "ASSISTANT_NOT_FOUND";
  }
  if (body.projectId) {
    const ok = await assertProjectActiveForTenant(tenantId, body.projectId);
    if (!ok) return "PROJECT_NOT_FOUND";
  }
  if (body.sessionId) {
    const ok = await assertChatSessionForTenant(tenantId, body.sessionId);
    if (!ok) return "SESSION_NOT_FOUND";
  }
  if (body.ownerUserId) {
    const ok = await assertUserBelongsToTenant(tenantId, body.ownerUserId);
    if (!ok) return "USER_NOT_FOUND";
  }
  return null;
}

export async function createWorkspaceLead(auth: AuthContext, body: CreateLeadBody) {
  const err = await validateLeadRelations(auth.tenantId, {
    assistantId: body.assistantId ?? null,
    projectId: body.projectId ?? null,
    sessionId: body.sessionId ?? null,
    ownerUserId: body.ownerUserId ?? null,
  });
  if (err) throw new Error(err);

  const metaSeed =
    body.metadata && typeof body.metadata === "object"
      ? (body.metadata as Record<string, unknown>)
      : {};
  const attributionSeed =
    body.attribution && typeof body.attribution === "object"
      ? (body.attribution as Record<string, unknown>)
      : {};

  const row = await insertLeadRow({
    tenantId: auth.tenantId,
    assistantId: body.assistantId ?? undefined,
    projectId: body.projectId ?? undefined,
    sessionId: body.sessionId ?? undefined,
    ownerUserId: body.ownerUserId ?? undefined,
    name: body.name.trim(),
    contact: body.contact.trim(),
    phone: body.phone?.trim() ?? undefined,
    email: body.email?.trim() ?? undefined,
    summary: body.summary?.trim() ?? "",
    interest: body.interest?.trim() ?? "",
    source: body.source ?? "other",
    pipelineStatus: body.pipelineStatus ?? "new",
    attribution:
      Object.keys(attributionSeed).length > 0 ? (attributionSeed as Prisma.InputJsonValue) : Prisma.JsonNull,
    metadata:
      Object.keys(metaSeed).length > 0 ? (metaSeed as Prisma.InputJsonValue) : Prisma.JsonNull,
  });

  const dto = leadDtoFromRow(row);
  emitLeadUpdated(auth.tenantId, dto.id, { reason: "created" });
  return dto;
}

export async function patchWorkspaceLead(auth: AuthContext, leadId: string, body: PatchLeadBody) {
  const row = await findLeadActiveForTenant(leadId, auth.tenantId);
  if (!row) return null;

  const err = await validateLeadRelations(auth.tenantId, {
    assistantId: body.assistantId ?? undefined,
    projectId: body.projectId ?? undefined,
    sessionId: body.sessionId ?? undefined,
    ownerUserId: body.ownerUserId ?? undefined,
  });
  if (err) throw new Error(err);

  let attributionJson: Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined;
  if (body.attributionPatch && Object.keys(body.attributionPatch).length > 0) {
    attributionJson = mergeAttribution(row.attribution, body.attributionPatch) as Prisma.InputJsonValue;
  }

  let metadataJson: Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined;
  const metaPatches: Record<string, unknown> = { ...(body.metadataPatch ?? {}) };
  if (body.notes !== undefined) {
    metaPatches.crm = { ...(typeof metaPatches.crm === "object" && metaPatches.crm !== null ? (metaPatches.crm as Record<string, unknown>) : {}), notes: body.notes };
  }
  if (Object.keys(metaPatches).length > 0) {
    metadataJson = shallowMergeJson(row.metadata, metaPatches) as Prisma.InputJsonValue;
  }

  const updated = await updateLeadRow(leadId, auth.tenantId, {
    ...(body.name !== undefined ? { name: body.name.trim() } : {}),
    ...(body.contact !== undefined ? { contact: body.contact.trim() } : {}),
    ...(body.phone !== undefined ? { phone: body.phone } : {}),
    ...(body.email !== undefined ? { email: body.email } : {}),
    ...(body.summary !== undefined ? { summary: body.summary.trim() } : {}),
    ...(body.interest !== undefined ? { interest: body.interest.trim() } : {}),
    ...(body.source !== undefined ? { source: body.source } : {}),
    ...(body.pipelineStatus !== undefined ? { pipelineStatus: body.pipelineStatus } : {}),
    ...(body.assistantId !== undefined ? { assistantId: body.assistantId } : {}),
    ...(body.projectId !== undefined ? { projectId: body.projectId } : {}),
    ...(body.sessionId !== undefined ? { sessionId: body.sessionId } : {}),
    ...(body.ownerUserId !== undefined ? { ownerUserId: body.ownerUserId } : {}),
    ...(attributionJson !== undefined ? { attribution: attributionJson } : {}),
    ...(metadataJson !== undefined ? { metadata: metadataJson } : {}),
  });

  const dto = updated ? leadDtoFromRow(updated) : null;
  if (dto) emitLeadUpdated(auth.tenantId, dto.id, { reason: "patched" });
  return dto;
}

export async function archiveWorkspaceLead(auth: AuthContext, leadId: string) {
  const ok = await archiveLeadRow(leadId, auth.tenantId);
  if (ok) emitLeadUpdated(auth.tenantId, leadId, { archived: true });
  return ok;
}

export async function createLeadFromTool(input: {
  tenantId: string;
  sessionId: string;
  assistantId?: string | null;
  name: string;
  contact: string;
  idempotencyKey: string;
}): Promise<{ leadId: string; idempotentHit: boolean }> {
  const existing = await findLeadByIdempotencyKey(input.tenantId, input.idempotencyKey);
  if (existing) {
    return { leadId: existing.id, idempotentHit: true };
  }

  const row = await insertLeadRow({
    tenantId: input.tenantId,
    sessionId: input.sessionId,
    assistantId: input.assistantId ?? undefined,
    name: input.name.trim(),
    contact: input.contact.trim(),
    summary: "",
    interest: "",
    source: "tool",
    pipelineStatus: "new",
    idempotencyKey: input.idempotencyKey,
    metadata: {
      crm: {
        timeline: [
          {
            id: `tl_${Date.now()}`,
            kind: "system",
            text: "Лид создан (tool:create_lead)",
            at: new Date().toISOString(),
          },
        ],
      },
    } as Prisma.InputJsonValue,
  });

  emitLeadUpdated(input.tenantId, row.id, { reason: "tool_created", sessionId: input.sessionId });
  return { leadId: row.id, idempotentHit: false };
}
