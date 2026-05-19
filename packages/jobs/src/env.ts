import { z } from "zod";

export const workerEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  REDIS_URL: z.string().url(),
  DATABASE_URL: z.string().url(),
  WORKER_CONCURRENCY: z.coerce.number().int().positive().max(500).optional(),
});

export type WorkerEnv = z.infer<typeof workerEnvSchema>;

export function parseWorkerEnv(env: NodeJS.ProcessEnv = process.env): WorkerEnv {
  const parsed = workerEnvSchema.safeParse(env);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid worker environment:\n${message}`);
  }
  return parsed.data;
}
