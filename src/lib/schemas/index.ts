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

export const demoSourceEnum = z.enum(["landing", "first-100", "pricing", "contacts"]);

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
  source: demoSourceEnum.optional(),
});

export type DemoRequestInput = z.infer<typeof demoRequestSchema>;

export const assistantDraftSchema = z.object({
  name: z.string().trim().min(2, "Назовите ассистента").max(80),
  niche: nicheEnum,
  channelId: z.enum(["telegram", "website", "avito", "vk", "whatsapp", "instagram"]),
  toneOfVoice: z.enum(["formal", "neutral", "friendly"]).default("neutral"),
});

export type AssistantDraftInput = z.infer<typeof assistantDraftSchema>;

export const contactRequestSchema = z.object({
  name: z.string().trim().min(2, "Укажите имя").max(80),
  email: z.string().trim().email("Введите корректный email").max(120),
  topic: z.string().trim().min(3, "Опишите тему кратко").max(120),
  message: z
    .string()
    .trim()
    .min(10, "Расскажите чуть подробнее")
    .max(2000, "Слишком длинное сообщение"),
});

export type ContactRequestInput = z.infer<typeof contactRequestSchema>;
