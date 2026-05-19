/**
 * TrustStrip — лента «логотипов» (initials-плашки) + 1 строка proof.
 */
import { Container } from "@/components/layout/container";
import { useTrustLogos } from "@/lib/hooks/use-landing";
import { useLocale } from "@/lib/i18n/locale";

export function TrustStrip() {
  const { data: logos = [] } = useTrustLogos();
  const { t } = useLocale();

  return (
    <section className="border-y border-border bg-surface-muted/40 py-8">
      <Container>
        <div className="flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-ink-muted">{t("trust.copy")}</p>
          <ul className="flex flex-wrap items-center gap-2 md:gap-3">
            {logos.map((l) => (
              <li
                key={l.id}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-xs font-semibold text-ink-muted"
                aria-label={l.name}
              >
                <span className="font-display text-foreground">{l.initials}</span>
                <span className="hidden text-ink-subtle sm:inline">{l.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
