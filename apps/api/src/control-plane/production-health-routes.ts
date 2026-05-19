import type { FastifyInstance } from "fastify";
import { prisma } from "@botmate/database";

/**
 * Phase 6C — Kubernetes-style probes without replacing existing `/health` contracts.
 * - Liveness: process up (no dependency checks).
 * - Readiness: PostgreSQL reachable (minimal query).
 */
export function registerProductionHealthRoutes(app: FastifyInstance): void {
  app.get("/health/live", async () => ({
    ok: true,
    tier: "liveness",
  }));

  app.get("/health/ready", async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        ok: true,
        tier: "readiness",
        checks: { database: "ok" as const },
      };
    } catch {
      return reply.code(503).send({
        ok: false,
        tier: "readiness",
        checks: { database: "fail" as const },
      });
    }
  });
}
