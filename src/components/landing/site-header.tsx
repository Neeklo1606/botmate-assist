/**
 * SiteHeader — sticky-хедер маркетинга.
 * Desktop: лого + nav + 2 CTA. Mobile: лого + burger.
 */
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { BotmeLogo } from "@/components/brand/botme-logo";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/features", label: "Возможности" },
  { to: "/cases", label: "Кейсы" },
  { to: "/scenarios", label: "Сценарии" },
  { to: "/pricing", label: "Тарифы" },
  { to: "/faq", label: "FAQ" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <Container>
        <div className="flex h-14 items-center justify-between gap-4">
          <Link to="/" className="flex items-center" aria-label="botme — на главную">
            <BotmeLogo />
          </Link>

          <nav aria-label="Главное меню" className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => track("nav-click", { to: item.to, location: "header" })}
                className="rounded-md px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-foreground"
                activeProps={{ className: "text-foreground bg-surface-muted" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Button asChild variant="ghostInk" size="sm">
              <Link to="/login">Войти</Link>
            </Button>
            <Button asChild variant="brand" size="sm">
              <Link
                to="/"
                hash="demo"
                onClick={() => track("cta-click", { location: "header", intent: "demo" })}
              >
                Запустить за 3 дня
              </Link>
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-surface-muted md:hidden"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={open}
          >
            {open ? (
              <X className="h-5 w-5" strokeWidth={1.5} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </Container>

      {/* Mobile drawer */}
      <div
        className={cn("border-t border-border bg-background md:hidden", open ? "block" : "hidden")}
      >
        <Container>
          <nav aria-label="Мобильное меню" className="flex flex-col gap-1 py-3">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-[15px] font-medium text-foreground hover:bg-surface-muted"
                activeProps={{ className: "bg-surface-muted" }}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 pt-2">
              <Button asChild variant="outline" size="md" className="flex-1">
                <Link to="/login" onClick={() => setOpen(false)}>
                  Войти
                </Link>
              </Button>
              <Button asChild variant="brand" size="md" className="flex-1">
                <Link to="/" hash="demo" onClick={() => setOpen(false)}>
                  Демо
                </Link>
              </Button>
            </div>
          </nav>
        </Container>
      </div>
    </header>
  );
}
