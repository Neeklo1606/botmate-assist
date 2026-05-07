/**
 * / — временная заглушка новой главной (заменим в промпте 2).
 * Тёмный фон bg-base, центрированный лого + CTA на /assistant.
 */
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BotmeLogo } from "@/components/brand/botme-logo";
import { buildPageMeta, canonicalLink } from "@/lib/seo";

export const Route = createFileRoute("/_marketing/")({
  head: () => ({
    meta: buildPageMeta({
      title: "botme — скоро здесь будет новая главная",
      description: "Ассистент botme уже работает. Перейдите на /assistant.",
      path: "/",
    }),
    links: [canonicalLink("/")],
  }),
  component: ComingSoonHome,
});

function ComingSoonHome() {
  return (
    <section
      className="relative flex min-h-[calc(100vh-56px)] items-center justify-center bg-bg-base px-6 py-24 text-ink-dark"
      style={{ background: "var(--bg-base)" }}
    >
      <div className="absolute inset-0 -z-0 opacity-100" style={{ background: "var(--gradient-hero)" }} aria-hidden />
      <div className="relative z-10 flex max-w-xl flex-col items-center text-center">
        <BotmeLogo variant="dark" className="text-[48px]" />
        <h1
          className="mt-10 font-display text-[36px] font-semibold leading-[1.1] tracking-[-0.03em]"
          style={{ color: "var(--ink-dark)" }}
        >
          Скоро здесь будет новая главная
        </h1>
        <p className="mt-4 text-[15px]" style={{ color: "var(--ink-dark-muted)" }}>
          Ассистент уже работает. Перейти на /assistant
        </p>
        <Button asChild variant="signal" size="lg" className="mt-8">
          <Link to="/assistant">
            Открыть Assistant
            <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
          </Link>
        </Button>
      </div>
    </section>
  );
}
