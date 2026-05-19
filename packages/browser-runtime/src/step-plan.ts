import { z } from "zod";
import { browserMaxStepsPerRun } from "./constants.js";

export const BrowserStepSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("open"),
    url: z.string().min(1).max(4096),
    waitUntil: z.enum(["domcontentloaded", "load", "networkidle"]).optional(),
  }),
  z.object({
    kind: z.literal("click"),
    selector: z.string().min(1).max(4096),
    timeoutMs: z.number().int().positive().max(120_000).optional(),
  }),
  z.object({
    kind: z.literal("type"),
    selector: z.string().min(1).max(4096),
    text: z.string().max(8000),
    timeoutMs: z.number().int().positive().max(120_000).optional(),
  }),
  z.object({
    kind: z.literal("extract"),
    selector: z.string().min(1).max(4096),
    mode: z.enum(["text", "inner_html"]),
    timeoutMs: z.number().int().positive().max(120_000).optional(),
  }),
  z.object({
    kind: z.literal("wait"),
    waitKind: z.enum(["selector", "load"]),
    selector: z.string().min(1).max(4096).optional(),
    timeoutMs: z.number().int().positive().max(120_000).optional(),
  }),
  z.object({
    kind: z.literal("screenshot"),
    fullPage: z.boolean().optional(),
  }),
  z.object({
    kind: z.literal("close"),
    reason: z.string().max(128).optional(),
  }),
]);

export type BrowserStep = z.infer<typeof BrowserStepSchema>;

export const StepPlanSchema = z
  .array(BrowserStepSchema)
  .min(1)
  .max(browserMaxStepsPerRun());

export type BrowserStepPlan = z.infer<typeof StepPlanSchema>;
