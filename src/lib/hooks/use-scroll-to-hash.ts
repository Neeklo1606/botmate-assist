/**
 * useScrollToHash — вернёт onClick-handler, который плавно скроллит к
 * элементу с заданным id. Работает даже если URL уже содержит этот hash
 * (TanStack Router в этом случае не триггерит navigate, и useEffect
 * на location.hash не срабатывает повторно).
 *
 * Использование на CTA, ведущих к якорю на той же странице:
 *   const onCtaClick = useScrollToHash("demo");
 *   <Link to="/" hash="demo" onClick={onCtaClick}>...
 *
 * Не вызываем preventDefault — даём TanStack обновить URL,
 * параллельно скроллим вручную с учётом sticky-header.
 */
import { useCallback } from "react";

const HEADER_GAP = 72;

export function useScrollToHash(hash: string) {
  return useCallback(() => {
    // Дать React + router закоммитить переход (если он будет), затем скролл.
    requestAnimationFrame(() => {
      const el = document.getElementById(hash);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - HEADER_GAP;
      window.scrollTo({ top, behavior: "smooth" });
      // Коррекция через 350ms — перекрывает возможные layout-shift'ы
      // от lazy-секций ниже якоря.
      setTimeout(() => {
        const el2 = document.getElementById(hash);
        if (!el2) return;
        const top2 = el2.getBoundingClientRect().top + window.scrollY - HEADER_GAP;
        window.scrollTo({ top: top2, behavior: "smooth" });
      }, 350);
    });
  }, [hash]);
}
