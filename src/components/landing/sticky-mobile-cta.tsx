/**
 * StickyMobileCTA — sticky-bar внизу экрана на mobile.
 * Появляется после первого скролла. Один primary-CTA на demo-секцию.
 */
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur transition-transform duration-200 md:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <Button asChild variant="brand" size="lg" className="w-full">
        <Link to="/" hash="demo">
          Запустить за 3 дня
                   </Link>
      </Button>
    </div>
  );
}
