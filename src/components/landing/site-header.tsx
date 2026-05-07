/**
 * SiteHeader — sticky-хедер маркетинга.
 * Desktop: лого + nav + 2 CTA + язык. Mobile: лого + burger + язык в drawer.
 */
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, Globe, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { BotmeLogo } from "@/components/brand/botme-logo";
import { track } from "@/lib/analytics";
import { useLocale } from "@/lib/i18n/locale";
import { useCurrentUser } from "@/lib/hooks/use-auth";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { t, locale, setLocale } = useLocale();
  const { data: user } = useCurrentUser();
  const isAuthed = !!user;

  const navItems = [
    { to: "/assistant" as const, label: t("nav.assistant") },
    { to: "/media" as const, label: t("nav.media") },
    { to: "/site" as const, label: t("nav.site") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <Container>
        <div className="flex h-14 items-center justify-between gap-4">
          <Link to="/" className="flex items-center" aria-label={t("nav.toLanding")}>
            <BotmeLogo />
          </Link>

          <nav aria-label="Main menu" className="hidden items-center gap-1 md:flex">
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
            <LangToggle locale={locale} onChange={setLocale} t={t} />
            {isAuthed ? (
              <Button asChild variant="brand" size="sm">
                <Link to="/app" onClick={() => track("nav-click", { to: "/app", location: "header" })}>
                  <LayoutDashboard className="h-3.5 w-3.5" strokeWidth={2} />
                  В кабинет
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghostInk" size="sm">
                  <Link to="/login">{t("nav.login")}</Link>
                </Button>
                <Button asChild variant="brand" size="sm">
                  <Link
                    to="/onboarding/assistant"
                    onClick={() => track("cta-click", { location: "header", intent: "demo" })}
                  >
                    {t("cta.launch3")}
                  </Link>
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-surface-muted md:hidden"
            aria-label={open ? t("nav.menuClose") : t("nav.menuOpen")}
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
          <nav aria-label="Mobile menu" className="flex flex-col gap-1 py-3">
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
            <div className="mt-2 flex items-center justify-between gap-2 pt-2">
              <LangToggle locale={locale} onChange={setLocale} t={t} />
              <div className="flex flex-1 gap-2">
                {isAuthed ? (
                  <Button asChild variant="brand" size="md" className="flex-1">
                    <Link to="/app" onClick={() => setOpen(false)}>
                      <LayoutDashboard className="h-4 w-4" strokeWidth={2} />
                      В кабинет
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="outline" size="md" className="flex-1">
                      <Link to="/login" onClick={() => setOpen(false)}>
                        {t("nav.login")}
                      </Link>
                    </Button>
                    <Button asChild variant="brand" size="md" className="flex-1">
                      <Link to="/onboarding/assistant" onClick={() => setOpen(false)}>
                        {t("nav.demo")}
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </nav>
        </Container>
      </div>
    </header>
  );
}

function LangToggle({
  locale,
  onChange,
  t,
}: {
  locale: "ru" | "en";
  onChange: (l: "ru" | "en") => void;
  t: (k: "nav.langSwitch" | "nav.langRu" | "nav.langEn") => string;
}) {
  return (
    <div
      role="group"
      aria-label={t("nav.langSwitch")}
      className="inline-flex items-center rounded-md border border-border bg-surface p-0.5 text-[11px] font-semibold uppercase tracking-wide"
    >
      <Globe className="ml-1.5 mr-1 h-3.5 w-3.5 text-ink-subtle" strokeWidth={1.75} aria-hidden />
      {(["ru", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => onChange(code)}
          aria-pressed={locale === code}
          className={cn(
            "rounded-sm px-2 py-1 transition-colors",
            locale === code
              ? "bg-foreground text-background"
              : "text-ink-muted hover:text-foreground",
          )}
        >
          {code === "ru" ? t("nav.langRu") : t("nav.langEn")}
        </button>
      ))}
    </div>
  );
}
