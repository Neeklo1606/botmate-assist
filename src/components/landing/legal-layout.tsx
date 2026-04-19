/**
 * LegalLayout — общий шаблон для /legal/privacy и /legal/offer.
 * Тонкая колонка, длинный read с hierарchic заголовками.
 */
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import type { LegalDocument } from "@/types/entities";

interface LegalLayoutProps {
  doc: LegalDocument | null | undefined;
  isLoading?: boolean;
}

export function LegalLayout({ doc, isLoading }: LegalLayoutProps) {
  if (isLoading) {
    return (
      <Section size="md">
        <Container>
          <div className="mx-auto h-[600px] max-w-[760px] animate-pulse rounded-xl bg-surface-muted" />
        </Container>
      </Section>
    );
  }

  if (!doc) {
    return (
      <Section size="md">
        <Container>
          <div className="mx-auto max-w-md text-center">
            <h1 className="font-display text-3xl font-semibold text-foreground">
              Документ не найден
            </h1>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section size="md">
      <Container>
        <article className="mx-auto max-w-[760px]">
          <header className="mb-8 border-b border-border pb-6">
            <div className="text-xs uppercase tracking-wide text-ink-subtle">
              Версия {doc.version} · обновлено {doc.updatedAt}
            </div>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.02em] text-foreground md:text-4xl">
              {doc.title}
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
              {doc.intro}
            </p>
          </header>

          <div className="space-y-8">
            {doc.sections.map((s) => (
              <section key={s.heading}>
                <h2 className="font-display text-lg font-semibold text-foreground md:text-xl">
                  {s.heading}
                </h2>
                <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink-muted">
                  {s.paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>
      </Container>
    </Section>
  );
}
