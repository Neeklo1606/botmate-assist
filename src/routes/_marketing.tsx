/**
 * _marketing — pathless layout для всех публичных страниц.
 * Хедер + Outlet + футер + sticky mobile CTA.
 *
 * Hash-scroll: scrollRestoration отключён в router.tsx, поэтому скроллим вручную.
 *  1) useEffect на location.hash/pathname — первый рендер + межстраничные переходы.
 *  2) router.subscribe('onResolved') — ловит navigate() на тот же URL
 *     (повторный клик на тот же #demo из FinalCTA / pricing-section).
 */
import { useEffect } from "react";
import { Outlet, createFileRoute, useLocation, useRouter } from "@tanstack/react-router";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { StickyMobileCTA } from "@/components/landing/sticky-mobile-cta";

export const Route = createFileRoute("/_marketing")({
  component: MarketingLayout,
});

const HEADER_GAP = 72;

function scrollToHash(rawHash: string): boolean {
  const id = rawHash.replace(/^#/, "");
  if (!id) return false;
  const el = document.getElementById(id);
  if (!el) return false;
  const top = el.getBoundingClientRect().top + window.scrollY - HEADER_GAP;
  window.scrollTo({ top, behavior: "smooth" });
  return true;
}

function useHashScroll() {
  const location = useLocation();
  const router = useRouter();
  const hash = location.hash;
  const pathname = location.pathname;

  // (1) Первый рендер + смена pathname/hash через React-цикл.
  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      return;
    }
    let cancelled = false;
    const tryScroll = (attempt: number) => {
      if (cancelled) return;
      if (scrollToHash(hash)) {
        // Коррекция после возможной подгрузки lazy-секций.
        setTimeout(() => {
          if (!cancelled) scrollToHash(hash);
        }, 350);
        return;
      }
      if (attempt < 12) setTimeout(() => tryScroll(attempt + 1), 80);
    };
    requestAnimationFrame(() => requestAnimationFrame(() => tryScroll(0)));
    return () => {
      cancelled = true;
    };
  }, [hash, pathname]);

  // (2) Подписка на onResolved — срабатывает на каждый navigate(),
  //     включая клики на ссылку с тем же URL, что и текущий.
  useEffect(() => {
    const unsub = router.subscribe("onResolved", ({ toLocation }) => {
      if (!toLocation.hash) return;
      requestAnimationFrame(() => {
        scrollToHash(toLocation.hash);
        setTimeout(() => scrollToHash(toLocation.hash), 350);
      });
    });
    return unsub;
  }, [router]);
}

function MarketingLayout() {
  useHashScroll();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Skip-to-content — первый focusable элемент. Виден только при focus. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:inline-flex focus:items-center focus:rounded-md focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-background focus:shadow-lift focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
      >
        Перейти к содержимому
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 pb-[76px] focus:outline-none md:pb-0">
        <Outlet />
      </main>
      <SiteFooter variant={useLocation().pathname === "/" ? "dark" : "light"} />
      <StickyMobileCTA />
    </div>
  );
}
