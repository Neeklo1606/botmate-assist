/**
 * StickyMobileCTA — sticky-bar внизу экрана на mobile.
 * Появляется после первого скролла. Один primary-CTA на demo-секцию.
 *
 * Скрывается, когда в viewport попадает элемент с [data-hide-sticky-cta]
 * (используется на секциях с собственными CTA — Pricing, FinalCTA).
 */
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

export function StickyMobileCTA() {
  const [scrolled, setScrolled] = useState(false);
  const [overlapping, setOverlapping] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>("[data-hide-sticky-cta]");
    if (!targets.length) return;

    const visible = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) visible.add(e.target);
          else visible.delete(e.target);
        });
        setOverlapping(visible.size > 0);
      },
      { rootMargin: "0px 0px -20% 0px", threshold: 0 },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  const visible = scrolled && !overlapping;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur transition-transform duration-200 md:hidden ${
        visible ? "translate-y-0" : "pointer-events-none translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <Button asChild variant="brand" size="lg" className="w-full" tabIndex={visible ? 0 : -1}>
        <Link to="/" hash="demo">
          Запустить за 3 дня
        </Link>
      </Button>
    </div>
  );
}
