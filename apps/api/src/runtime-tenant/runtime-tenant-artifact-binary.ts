import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { resolve } from "node:path";

import type { PrismaClient } from "@botmate/database";
import type { FastifyReply } from "fastify";

const MAX_ARTIFACT_BYTES = 25 * 1024 * 1024;

export interface ArtifactPreviewDescriptor {
  transport: "workspace_cookie_binary";
  /** Relative URL path (same origin as API base in typical deployments). */
  hrefPath: string;
  available: boolean;
}

function artifactRootDir(): string | null {
  const raw = process.env.BROWSER_ARTIFACT_ROOT?.trim();
  if (!raw) return null;
  return resolve(raw);
}

export function runtimeArtifactPreviewDescriptor(artifactId: string): ArtifactPreviewDescriptor {
  const hrefPath = `/api/v1/runtime/artifacts/${encodeURIComponent(artifactId)}/binary`;
  return {
    transport: "workspace_cookie_binary",
    hrefPath,
    available: artifactRootDir() !== null,
  };
}

async function resolveTenantArtifactAbs(params: {
  prisma: PrismaClient;
  tenantId: string;
  artifactId: string;
}): Promise<{ absPath: string; contentType: string | null } | null> {
  const root = artifactRootDir();
  if (!root) return null;

  const row = await params.prisma.browserArtifact.findFirst({
    where: { id: params.artifactId, tenantId: params.tenantId, deletedAt: null },
    select: { storageKey: true, contentType: true },
  });
  if (!row) return null;

  const normalized = row.storageKey.replace(/^\/+/, "");
  const absPath = resolve(root, normalized);
  if (!absPath.startsWith(resolve(root))) {
    throw new Error("artifact_path_escape");
  }

  return { absPath, contentType: row.contentType };
}

export async function streamRuntimeArtifactBinary(input: {
  prisma: PrismaClient;
  tenantId: string;
  artifactId: string;
  reply: FastifyReply;
  traceId: string;
}): Promise<void> {
  const resolved = await resolveTenantArtifactAbs({
    prisma: input.prisma,
    tenantId: input.tenantId,
    artifactId: input.artifactId,
  });

  if (!resolved) {
    if (!artifactRootDir()) {
      await input.reply.code(503).send({
        error: {
          code: "RUNTIME_ARTIFACT_BINARY_UNAVAILABLE",
          message: "Set BROWSER_ARTIFACT_ROOT on API host to enable authenticated artifact streaming.",
          trace_id: input.traceId,
        },
      });
      return;
    }

    await input.reply.code(404).send({
      error: { code: "RUNTIME_ARTIFACT_NOT_FOUND", message: "Artifact not found", trace_id: input.traceId },
    });
    return;
  }

  try {
    const st = await stat(resolved.absPath);
    if (!st.isFile()) {
      await input.reply.code(404).send({
        error: { code: "RUNTIME_ARTIFACT_FILE_MISSING", message: "Artifact blob missing on disk", trace_id: input.traceId },
      });
      return;
    }
    if (st.size > MAX_ARTIFACT_BYTES) {
      await input.reply.code(413).send({
        error: { code: "RUNTIME_ARTIFACT_TOO_LARGE", message: "Artifact exceeds streaming cap", trace_id: input.traceId },
      });
      return;
    }

    if (resolved.contentType) {
      void input.reply.header("Content-Type", resolved.contentType);
    }
    void input.reply.header("Cache-Control", "private, max-age=60");

    const stream = createReadStream(resolved.absPath);
    await input.reply.send(stream);
  } catch (err) {
    await input.reply.code(500).send({
      error: {
        code: "RUNTIME_ARTIFACT_STREAM_FAILED",
        message: err instanceof Error ? err.message.slice(0, 240) : "stream_failed",
        trace_id: input.traceId,
      },
    });
  }
}
