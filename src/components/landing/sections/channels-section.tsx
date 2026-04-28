/**
 * ChannelsSection — 6 каналов общения. status-badge на beta.
 */
import { Container } from "@/components/layout/container";
import { Section, SectionHeading } from "@/components/layout/section";
import { ChannelIcon } from "@/components/brand/channel-icon";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { useChannels } from "@/lib/hooks/use-landing";
import { useLocale } from "@/lib/i18n/locale";

export function ChannelsSection() {
  const { data: channels = [] } = useChannels();
  const { t } = useLocale();

  return (
    <Section tone="default" size="md">
      <Container>
        <SectionHeading
          eyebrow={t("channels.eyebrow")}
          title={t("channels.title")}
          description={t("channels.desc")}
        />

        <RevealGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map((c) => (
            <RevealItem
              key={c.id}
              className="flex items-start gap-3 rounded-xl border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted text-foreground">
                <ChannelIcon id={c.id} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-display text-[15px] font-semibold text-foreground">
                    {c.name}
                  </div>
                  {c.status !== "live" ? (
                    <span className="inline-flex items-center rounded-sm bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted">
                      {c.status === "beta" ? t("channels.beta") : t("channels.soon")}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-ink-muted">{c.description}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </Section>
  );
}
