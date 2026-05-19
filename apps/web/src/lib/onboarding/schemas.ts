/**
 * Zod schemas для каждого продукта.
 * В этом промпте — заглушки, наполним реальные поля в 6B.
 */
import { z } from "zod";

export const assistantBriefSchema = z.object({}).passthrough();
export const mediaBriefSchema = z.object({}).passthrough();
export const siteBriefSchema = z.object({}).passthrough();

export type AssistantBrief = z.infer<typeof assistantBriefSchema>;
export type MediaBrief = z.infer<typeof mediaBriefSchema>;
export type SiteBrief = z.infer<typeof siteBriefSchema>;
