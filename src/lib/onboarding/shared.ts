/**
 * Общие куски для всех брифов.
 */
import type { WizardStepDef } from "./types";

export function requireFields(
  data: Record<string, unknown>,
  rules: Array<{ name: string; message?: string; predicate?: (v: unknown) => boolean }>,
): Record<string, string> | null {
  const errors: Record<string, string> = {};
  for (const r of rules) {
    const v = data[r.name];
    const ok = r.predicate
      ? r.predicate(v)
      : !(v === undefined || v === null || (typeof v === "string" && v.trim() === "") ||
          (Array.isArray(v) && v.length === 0));
    if (!ok) errors[r.name] = r.message ?? "Заполните это поле";
  }
  return Object.keys(errors).length ? errors : null;
}

export function isContact(v: unknown): boolean {
  if (typeof v !== "string") return false;
  const s = v.trim();
  if (!s) return false;
  if (s.startsWith("@") && s.length > 1) return true;
  return /.+@.+\..+/.test(s);
}

export function contactStep(productNoun: string = "продукт"): WizardStepDef {
  return {
    id: "contact",
    kind: "auth",
    title: "Готово. Создаём аккаунт.",
    description: `Через 5 минут пришлём доступ и черновик ${productNoun} на основе ваших ответов.`,
    fields: [
      {
        type: "text",
        name: "name",
        label: "Ваше имя",
        placeholder: "Никита",
        required: true,
      },
      {
        type: "text",
        name: "contact",
        label: "Telegram или email",
        placeholder: "@nikita или nikita@example.com",
        helperText: "Куда отправить ссылку на личный кабинет",
        required: true,
      },
      {
        type: "checkbox",
        name: "consent",
        label:
          "Я соглашаюсь с условиями использования и политикой конфиденциальности",
        required: true,
      },
    ],
    validate: (data) =>
      requireFields(data, [
        { name: "name", message: "Укажите имя" },
        {
          name: "contact",
          message: "Введите Telegram (@user) или email",
          predicate: isContact,
        },
        {
          name: "consent",
          message: "Нужно согласиться с условиями",
          predicate: (v) => v === true,
        },
      ]),
  };
}

export function slugify(s: string | undefined | null): string {
  if (!s) return "your_brand";
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh",
    щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  const trans = s
    .toLowerCase()
    .split("")
    .map((c) => map[c] ?? c)
    .join("");
  return trans.replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "your_brand";
}

export function initials(s: string | undefined | null, fallback = "АС"): string {
  if (!s || !s.trim()) return fallback;
  const parts = s.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return s.trim().slice(0, 2).toUpperCase();
}
