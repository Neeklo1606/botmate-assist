import { z } from "zod";

const MIN_SECRET_LENGTH = 32;

function requiredSecret(name: string) {
  return z
    .string({ required_error: `${name} is required` })
    .min(MIN_SECRET_LENGTH, `${name} must be at least ${MIN_SECRET_LENGTH} characters`);
}

/** API service environment (Node). */
export const apiEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: requiredSecret("JWT_SECRET"),
    ENCRYPTION_MASTER_KEY: requiredSecret("ENCRYPTION_MASTER_KEY"),
    REDIS_URL: z.string().url().optional(),
    ALLOWED_ORIGINS: z.string().optional(),
    IP_RATE_LIMIT_PER_MIN: z.coerce.number().int().positive().default(240),
    TENANT_RATE_LIMIT_PER_MIN: z.coerce.number().int().positive().default(120),
    TENANT_REQUESTS_PER_MIN: z.coerce.number().int().positive().default(60),
    ENABLE_DEV_SEED: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),
    DEV_SEED_EMAIL: z.string().email().optional(),
    DEV_SEED_PASSWORD: z.string().min(10).optional(),
    DEV_SEED_NAME: z.string().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.ENABLE_DEV_SEED) {
      if (!data.DEV_SEED_EMAIL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "DEV_SEED_EMAIL is required when ENABLE_DEV_SEED=true",
          path: ["DEV_SEED_EMAIL"],
        });
      }
      if (!data.DEV_SEED_PASSWORD) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "DEV_SEED_PASSWORD is required when ENABLE_DEV_SEED=true",
          path: ["DEV_SEED_PASSWORD"],
        });
      }
    }
    if (data.JWT_SECRET === "change-me" && data.NODE_ENV === "production") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "JWT_SECRET must not be the default value in production",
        path: ["JWT_SECRET"],
      });
    }
  });

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export function parseApiEnv(env: NodeJS.ProcessEnv = process.env): ApiEnv {
  const result = apiEnvSchema.safeParse(env);
  if (!result.success) {
    const message = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid API environment:\n${message}`);
  }
  return result.data;
}

/** Web app (Vite) public env. */
export const webEnvSchema = z.object({
  VITE_SITE_URL: z.string().url().optional(),
  VITE_API_URL: z.string().url().default("http://localhost:3001"),
  /** Projects persistence: `session` (legacy sessionStorage) or `api` (PostgreSQL `/api/v1/projects`). */
  VITE_PROJECTS_DATA_SOURCE: z.enum(["session", "api"]).default("api"),
  /** Assistants persistence: `session` (legacy) or `api` (PostgreSQL `/api/v1/assistants`). */
  VITE_ASSISTANTS_DATA_SOURCE: z.enum(["session", "api"]).default("api"),
  /** Workspace chat: `session` (legacy) or `api` (PostgreSQL `/api/v1/chat/*`). */
  VITE_CHAT_DATA_SOURCE: z.enum(["session", "api"]).default("api"),
  /** CRM leads: `session` (legacy) or `api` (`/api/v1/leads`). */
  VITE_LEADS_DATA_SOURCE: z.enum(["session", "api"]).default("api"),
  /** Workspace WebSocket bridge (`/api/v1/realtime/ws`). */
  VITE_REALTIME_ENABLED: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
});

export type WebEnv = z.infer<typeof webEnvSchema>;
