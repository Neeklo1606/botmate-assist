/**
 * Phase 12C — lightweight in-product feedback (API → ProductFeedback table).
 */
import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import type { ProductFeedbackBody } from "@botmate/shared";
import { apiClient } from "@/lib/api/client";
import { isRealAuthEnabled } from "@/lib/auth/config";
import { trackProductEvent } from "@/lib/product-analytics";

type FeedbackCategory = ProductFeedbackBody["category"];

const CATEGORIES: { value: FeedbackCategory; label: string }[] = [
  { value: "onboarding", label: "Онбординг" },
  { value: "runtime", label: "Исполнения" },
  { value: "browser", label: "Браузер" },
  { value: "operator", label: "Оператор" },
  { value: "compare", label: "Сравнение" },
  { value: "general", label: "Общее" },
];

export function ProductFeedbackButton(props: { defaultCategory?: FeedbackCategory; className?: string }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>(props.defaultCategory ?? "general");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  if (!isRealAuthEnabled()) return null;

  async function submit() {
    if (message.trim().length < 3) return;
    setStatus("sending");
    try {
      await apiClient.submitProductFeedback({
        category,
        message: message.trim(),
        route: typeof window !== "undefined" ? window.location.pathname : undefined,
      });
      trackProductEvent("feedback.submitted", { props: { category } });
      setStatus("sent");
      setMessage("");
      setTimeout(() => {
        setOpen(false);
        setStatus("idle");
      }, 1200);
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <button
        type="button"
        className={
          props.className ??
          "inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/5"
        }
        onClick={() => setOpen(true)}
      >
        <MessageSquarePlus className="size-3.5" aria-hidden />
        Обратная связь
      </button>
      {open ?
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Обратная связь"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-white/15 bg-[#1a1a1a] p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-medium text-white">Поделиться отзывом</h3>
            <p className="mt-1 text-xs text-white/50">Помогает нам улучшать продукт.</p>
            <label className="mt-3 block text-xs text-white/60">
              Раздел
              <select
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-2 py-2 text-sm text-white"
                value={category}
                onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-xs text-white/60">
              Сообщение
              <textarea
                className="mt-1 min-h-[100px] w-full rounded-lg border border-white/15 bg-black/30 px-2 py-2 text-sm text-white"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Что понравилось? Что было неудобно?"
              />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-xs text-white/60 hover:text-white"
                onClick={() => setOpen(false)}
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={status === "sending" || message.trim().length < 3}
                className="rounded-lg bg-lime-400 px-3 py-2 text-xs font-medium text-black disabled:opacity-50"
                onClick={() => void submit()}
              >
                {status === "sent" ? "Спасибо!" : status === "sending" ? "Отправляем…" : "Отправить"}
              </button>
            </div>
            {status === "error" ?
              <p className="mt-2 text-xs text-red-300">Не удалось отправить — попробуйте позже.</p>
            : null}
          </div>
        </div>
      : null}
    </>
  );
}
