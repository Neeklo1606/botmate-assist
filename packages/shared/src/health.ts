import { z } from "zod";

export const HealthResponseSchema = z.object({
  ok: z.literal(true),
});

export const ApiInfoResponseSchema = z.object({
  name: z.string(),
  ok: z.boolean(),
  docs: z.string().optional(),
});
