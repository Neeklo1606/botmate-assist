/**
 * Единый источник правды для форм и DTO.
 * Все формы идут через RHF + zodResolver(...) этих схем.
 */

import { z } from "zod";

export const nicheEnum = z.enum([
  "real_estate",
  "auto",
  "clinic",
  "services",
  "online_school",
  "agency",
  "other",
]);

export const demoRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Имя слишком короткое")
    .max(80, "Слишком длинное имя"),
  contact: z
    .string()
    .trim()
    .min(5, "Укажите телефон, email или @username")
    .max(120, "Слишком длинный контакт"),
  niche: nicheEnum,
});

export type DemoRequestInput = z.infer<typeof demoRequestSchema>;

export const assistantDraftSchema = z.object({
  name: z.string().trim().min(2, "Назовите ассистента").max(80),
  niche: nicheEnum,
  channelId: z.enum(["telegram", "website", "avito", "vk", "whatsapp", "instagram"]),
  toneOfVoice: z.enum(["formal", "neutral", "friendly"]).default("neutral"),
});

export type AssistantDraftInput = z.infer<typeof assistantDraftSchema>;
