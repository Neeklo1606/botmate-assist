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

/**
 * Тип контакта определяется автоматически по содержимому строки.
 * Используется в DemoForm для inline-подсказок и в дальнейшем — для маршрутизации
 * заявки в нужный канал (Telegram-бот / call-центр / email).
 */
export type ContactKind = "phone" | "email" | "telegram" | "unknown";

const PHONE_RE = /^[+\d][\d\s\-()]{6,}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TG_RE = /^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/;

export function detectContactKind(raw: string): ContactKind {
  const v = raw.trim();
  if (!v) return "unknown";
  if (EMAIL_RE.test(v)) return "email";
  const digits = v.replace(/\D/g, "");
  if (PHONE_RE.test(v) && digits.length >= 7 && digits.length <= 15) return "phone";
  if (TG_RE.test(v)) return "telegram";
  return "unknown";
}

export const demoRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Имя слишком короткое")
    .max(80, "Слишком длинное имя")
    .regex(/^[\p{L}\p{M}\s'’\-]+$/u, "Только буквы, пробел и дефис"),
  contact: z
    .string()
    .trim()
    .min(5, "Укажите телефон, email или @username")
    .max(120, "Слишком длинный контакт")
    .refine((v) => detectContactKind(v) !== "unknown", {
      message: "Похоже на опечатку. Пример: +7 999 123-45-67, ivan@mail.ru, @ivan",
    }),
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
