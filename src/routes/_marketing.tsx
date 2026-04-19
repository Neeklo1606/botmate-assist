/**
 * _marketing — pathless layout для всех публичных страниц.
 * Хедер + Outlet + футер + sticky mobile CTA.
 * Padding-bottom 76px на mobile под sticky-bar.
 */
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { StickyMobileCTA } from "@/components/landing/sticky-mobile-cta";

export const Route = createFileRoute("/_marketing")({
  component: MarketingLayout,
});

function MarketingLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1 pb-[76px] md:pb-0">
        <Outlet />
      </main>
      <SiteFooter />
      <StickyMobileCTA />
    </div>
  );
}
