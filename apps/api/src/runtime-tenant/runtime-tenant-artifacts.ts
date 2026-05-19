import type { PrismaClient } from "@botmate/database";
import type { RuntimeArtifactDetailResponse, RuntimeArtifactsListResponse } from "@botmate/shared";

import { runtimeArtifactPreviewDescriptor } from "./runtime-tenant-artifact-binary.js";

function storageSuffix(storageKey: string): string {
  const parts = storageKey.split("/");
  const tail = parts[parts.length - 1];
  return tail.length > 48 ? `${tail.slice(0, 24)}…${tail.slice(-12)}` : tail;
}

function metaPreview(meta: unknown): Record<string, unknown> {
  if (!meta || typeof meta !== "object") return {};
  const entries = Object.entries(meta as Record<string, unknown>).slice(0, 8);
  return Object.fromEntries(entries);
}

export async function listRuntimeArtifacts(input: {
  prisma: PrismaClient;
  tenantId: string;
  page: number;
  pageSize: number;
  browserSessionId?: string;
}): Promise<RuntimeArtifactsListResponse> {
  const where = {
    tenantId: input.tenantId,
    deletedAt: null,
    ...(input.browserSessionId ? { browserSessionId: input.browserSessionId } : {}),
  };

  const total = await input.prisma.browserArtifact.count({ where });
  const rows = await input.prisma.browserArtifact.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
    select: {
      id: true,
      kind: true,
      browserSessionId: true,
      browserRunId: true,
      byteLength: true,
      contentType: true,
      storageKey: true,
      metadata: true,
      createdAt: true,
    },
  });

  return {
    ok: true,
    projection: "tenant_browser_artifact_index_v1",
    items: rows.map((r) => ({
      id: r.id,
      kind: String(r.kind),
      browserSessionId: r.browserSessionId,
      browserRunId: r.browserRunId ?? null,
      byteLength: r.byteLength.toString(),
      contentType: r.contentType ?? null,
      storageKeySuffix: storageSuffix(r.storageKey),
      metadataPreview: metaPreview(r.metadata),
      createdAt: r.createdAt.toISOString(),
    })),
    page: input.page,
    pageSize: input.pageSize,
    total,
  };
}

export async function getRuntimeArtifactDetail(input: {
  prisma: PrismaClient;
  tenantId: string;
  artifactId: string;
}): Promise<RuntimeArtifactDetailResponse | null> {
  const row = await input.prisma.browserArtifact.findFirst({
    where: { id: input.artifactId, tenantId: input.tenantId, deletedAt: null },
    select: {
      id: true,
      kind: true,
      browserSessionId: true,
      browserRunId: true,
      byteLength: true,
      contentType: true,
      storageKey: true,
      metadata: true,
      createdAt: true,
      sha256: true,
      expiresAt: true,
      deletedAt: true,
    },
  });
  if (!row) return null;

  const base = {
    id: row.id,
    kind: String(row.kind),
    browserSessionId: row.browserSessionId,
    browserRunId: row.browserRunId ?? null,
    byteLength: row.byteLength.toString(),
    contentType: row.contentType ?? null,
    storageKeySuffix: storageSuffix(row.storageKey),
    metadataPreview: metaPreview(row.metadata),
    createdAt: row.createdAt.toISOString(),
    sha256: row.sha256 ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };

  return {
    ok: true,
    projection: "tenant_browser_artifact_detail_v1",
    artifact: base,
    preview: runtimeArtifactPreviewDescriptor(row.id),
  };
}
