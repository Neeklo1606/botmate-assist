/**
 * analytics.ts — единая точка трекинга событий.
 *
 * Провайдер: Plausible (lightweight, без cookies, GDPR-friendly).
 * Скрипт подключается в src/routes/__root.tsx через head.scripts
 * с атрибутом data-domain = PLAUSIBLE_DOMAIN.
 *
 * Все события идут через типизированный track(name, props?). Если plausible
 * ещё не загрузился (или domain не настроен / SSR) — событие проглатывается.
 *
 * Имена событий — kebab-case, латиница. Лимит Plausible на пропсы — 30 ключей,
 * value до 2KB; держим props плоскими и короткими.
 */

/** Домен для data-domain. Замените на свой при публикации. */
export const PLAUSIBLE_DOMAIN = "botme.ru";

/** Имя skript URL — self-hosted в будущем легко подменить. */
export const PLAUSIBLE_SRC = "https://plausible.io/js/script.js";

/**
 * Реестр всех событий и их пропсов. Расширяйте здесь — TS подскажет места,
 * где нужно обновить вызовы.
 */
export type AnalyticsEventMap = {
  "cta-click": {
    /** Где находился CTA: hero, pricing, final-cta, sticky, header. */
    location: "hero" | "pricing" | "final-cta" | "sticky" | "header" | "first-100";
    /** Текст или назначение кнопки: demo, how, login, plan-pro и т.п. */
    intent: string;
  };
  "demo-form-submit": {
    /** Откуда отправили форму. */
    source: "landing" | "first-100" | "pricing" | "footer";
    niche: string;
    /** phone | email | telegram (определяется на клиенте). */
    contact_kind: string;
  };
  "pricing-view": {
    /** С какой страницы пришли: nav, hero-secondary, pricing-section-link. */
    from: string;
  };
  "faq-open": {
    /** ID вопроса из mock-данных. */
    question_id: string;
  };
  "nav-click": {
    /** Куда ведёт ссылка. */
    to: string;
    /** Откуда: header | footer | mobile-menu. */
    location: "header" | "footer" | "mobile-menu";
  };
};

export type AnalyticsEventName = keyof AnalyticsEventMap;

/** Глобальная функция Plausible, которую инжектит script. */
declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: Record<string, string | number | boolean> },
    ) => void;
  }
}

/**
 * Отправить событие. Безопасно вызывать на любом этапе (SSR / до загрузки скрипта).
 */
export function track<E extends AnalyticsEventName>(
  event: E,
  props?: AnalyticsEventMap[E],
): void {
  if (typeof window === "undefined") return;
  const fn = window.plausible;
  if (typeof fn !== "function") return;
  try {
    fn(event, props ? { props: props as Record<string, string | number | boolean> } : undefined);
  } catch {
    // Никогда не ломаем UX из-за аналитики.
  }
}
