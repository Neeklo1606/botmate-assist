/**
 * _marketing — pathless layout для всех публичных страниц.
 * Хедер + Outlet + футер + sticky mobile CTA.
 * Padding-bottom 76px на mobile под sticky-bar.
 *
 * Hash-scroll: TanStack Router scrollRestoration перетирает дефолтный
 * браузерный hash-scroll. Поэтому слушаем location.hash и скроллим к якорю
 * вручную с учётом высоты sticky header (≈64px).
 */
import { useEffect } from "react";
import { Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { StickyMobileCTA } from "@/components/landing/sticky-mobile-cta";

export const Route = createFileRoute("/_marketing")({
  component: MarketingLayout,
});

function useHashScroll() {
  const location = useLocation();
  const hash = location.hash;
  const pathname = location.pathname;

  useEffect(() => {
    if (!hash) {
      // Без hash — на верх страницы. scrollRestoration TanStack отключён в router.
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    // Lazy-секции ниже #demo (Pricing/Cases/FAQ) не влияют на позицию #demo,
    // но дожидаемся 1-2 RAF + ретраи для подстраховки.
    let cancelled = false;
    const tryScroll = (attempt: number) => {
      if (cancelled) return;
      const el = document.getElementById(hash);
      if (el) {
        // scrollIntoView уважает CSS scroll-margin-top из html { scroll-padding-top }
        // и section[id] { scroll-margin-top }. Никакого ручного offset.
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (attempt < 12) {
        setTimeout(() => tryScroll(attempt + 1), 80);
      }
    };
    // Первая попытка после двух RAF — гарантия, что DOM закоммичен.
    requestAnimationFrame(() => requestAnimationFrame(() => tryScroll(0)));
    return () => {
      cancelled = true;
    };
  }, [hash, pathname]);
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
      <SiteFooter />
      <StickyMobileCTA />
    </div>
  );
}
