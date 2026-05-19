/**
 * /integrations — посадочная по интеграциям и каналам.
 * Hero + каналы + CRM/Data/Automation сетка + CTA.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Plug } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section, SectionHeading } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { ChannelIcon } from "@/components/brand/channel-icon";
import { useChannels } from "@/lib/hooks/use-landing";
import { useIntegrationsList } from "@/lib/hooks/use-marketing";
import { FinalCTA } from "@/components/landing/sections/final-cta";
import { cn } from "@/lib/utils";
import type { Integration } from "@/types/entities";
import { buildPageMeta, canonicalLink } from "@/lib/seo";

export const Route = createFileRoute("/_marketing/integrations")({
  head: () => ({
    meta: buildPageMeta({
      title: "Интеграции и каналы botme — Telegram, Avito, amoCRM",
      description:
        "Telegram, сайт, Avito, ВКонтакте, WhatsApp, Instagram. Связки с amoCRM, Битрикс24, YClients, Notion, Google Sheets и Webhook.",
      path: "/integrations",
    }),
    links: [canonicalLink("/integrations")],
  }),
  component: IntegrationsPage,
});

const STATUS_LABEL: Record<Integration["status"], string> = {
  live: "Готово",
  beta: "Бета",
  soon: "Скоро",
};

const STATUS_CLASS: Record<Integration["status"], string> = {
  live: "bg-accent text-accent-ink",
  beta: "bg-surface-muted text-foreground",
  soon: "bg-surface-muted text-ink-subtle",
};

const CATEGORY_TITLE: Record<Integration["category"], string> = {
  crm: "CRM-системы",
  data: "Данные и базы знаний",
  automation: "Автоматизация",
};

function IntegrationsPage() {
  const { data: channels = [] } = useChannels();
  const { data: integrations = [] } = useIntegrationsList();

  const grouped = (["crm", "data", "automation"] as const).map((cat) => ({
    cat,
    items: integrations.filter((i) => i.category === cat),
  }));

  return (
    <>
      {/* Hero */}
      <Section size="lg">
        <Container>
          <div className="mx-auto max-w-[820px] text-center">
            <div className="mb-4 inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Интеграции
            </div>
            <h1 className="font-display text-4xl font-semibold tracking-[-0.02em] md:text-[56px] md:leading-[1.05]">
              Подключаем туда, где уже общаются ваши клиенты
            </h1>
            <p className="mt-5 text-base text-ink-muted md:text-lg">
              6 каналов общения и 9+ готовых интеграций. Кастомные связки доступны на тарифе «Масштаб»
              через API и Webhook.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild variant="brand" size="lg">
                <Link to="/assistant" hash="demo">
                  Получить демо
                  <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/contacts">Нужна нестандартная связка</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      {/* Channels */}
      <Section tone="muted" size="md">
        <Container>
          <SectionHeading
            eyebrow="Каналы"
            title="Где работает ассистент"
            description="Один аккаунт, один тон, единая база знаний. Все каналы синхронизированы."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {channels.map((ch) => (
              <div
                key={ch.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-background p-5"
              >
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-foreground text-background">
                  <ChannelIcon id={ch.id} className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-display text-base font-semibold text-foreground">
                      {ch.name}
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                        ch.status === "live"
                          ? "bg-accent text-accent-ink"
                          : "bg-surface-muted text-ink-muted",
                      )}
                    >
                      {ch.status === "live" ? "Live" : "Beta"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">{ch.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Integrations grouped */}
      <Section size="md">
        <Container>
          <SectionHeading eyebrow="Интеграции" title="С вашими системами без программистов" />
          <div className="space-y-12">
            {grouped.map(({ cat, items }) => (
              <div key={cat}>
                <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
                  {CATEGORY_TITLE[cat]}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((it) => (
                    <article
                      key={it.id}
                      className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4"
                    >
                      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-foreground text-background font-mono text-xs font-semibold">
                        {it.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-display text-base font-semibold text-foreground">
                            {it.name}
                          </div>
                          <span
                            className={cn(
                              "rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                              STATUS_CLASS[it.status],
                            )}
                          >
                            {STATUS_LABEL[it.status]}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-ink-muted">{it.description}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex items-start gap-4 rounded-xl border border-border-strong bg-surface p-5">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-accent text-accent-ink">
              <Plug className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <h4 className="font-display text-base font-semibold text-foreground">
                Нужна связка с вашей системой?
              </h4>
              <p className="mt-1 text-sm text-ink-muted">
                На тарифе «Масштаб» делаем кастомные интеграции по ТЗ. Webhook и API доступны на
                всех тарифах от «Рост».
              </p>
            </div>
            <Button asChild variant="brand" size="md" className="self-center">
              <Link to="/contacts">Обсудить</Link>
            </Button>
          </div>
        </Container>
      </Section>

      <FinalCTA />
    </>
  );
}
