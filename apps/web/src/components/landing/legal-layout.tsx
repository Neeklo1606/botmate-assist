/**
 * LegalLayout — общий шаблон для /legal/privacy и /legal/offer.
 *
 * Структура:
 *  — Breadcrumb (Главная → Документы → текущий).
 *  — Длинная читаемая колонка (760px), h2 с id-якорями для прямых ссылок.
 *  — Sticky table of contents справа на lg+ (sidebar).
 *  — Footer с cross-link на парный документ + контакт юр. отдела.
 *
 * Контент тянется из legalDocs (mock repository) — единый источник правды,
 * чтобы версия и updatedAt совпадали с тем, что показано в шапке.
 */
import { Link } from "@tanstack/react-router";
import { ChevronRight, FileText, Mail } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import type { LegalDocument } from "@/types/entities";
import { cn } from "@/lib/utils";

interface LegalLayoutProps {
  doc: LegalDocument | null | undefined;
  isLoading?: boolean;
}

/** Slug → заголовок в крошках и в cross-link */
const DOC_LABELS: Record<LegalDocument["slug"], string> = {
  privacy: "Политика конфиденциальности",
  offer: "Договор-оферта",
};

/** Slug → парный документ для cross-link внизу. */
const PAIR: Record<LegalDocument["slug"], LegalDocument["slug"]> = {
  privacy: "offer",
  offer: "privacy",
};

/**
 * Сгенерировать стабильный id для h2-якоря.
 * Берём первое число в начале (нумерация секций «1. …»), иначе slugify.
 */
function headingToId(heading: string): string {
  const numMatch = heading.match(/^(\d+)\./);
  if (numMatch) return `s-${numMatch[1]}`;
  return heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
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
            <p className="mt-3 text-sm text-ink-muted">
              Возможно, ссылка устарела. Все актуальные документы доступны в футере.
            </p>
            <Link
              to="/"
              className="mt-6 inline-block text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              На главную
            </Link>
          </div>
        </Container>
      </Section>
    );
  }

  const pairSlug = PAIR[doc.slug];
  const pairLabel = DOC_LABELS[pairSlug];
  const pairTo = pairSlug === "privacy" ? "/legal/privacy" : "/legal/offer";

  return (
    <Section size="md">
      <Container>
        <nav
          aria-label="Хлебные крошки"
          className="mb-6 flex items-center gap-1.5 text-xs text-ink-subtle"
        >
          <Link to="/" className="hover:text-foreground">
            Главная
          </Link>
          <ChevronRight className="h-3 w-3" strokeWidth={1.5} aria-hidden />
          <span className="text-ink-subtle">Документы</span>
          <ChevronRight className="h-3 w-3" strokeWidth={1.5} aria-hidden />
          <span className="text-foreground">{DOC_LABELS[doc.slug]}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-12">
          <article className="lg:col-span-8 xl:col-span-9">
            <header className="mb-8 border-b border-border pb-6">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-ink-subtle">
                <FileText className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                Версия {doc.version} · обновлено {doc.updatedAt}
              </div>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.02em] text-foreground md:text-4xl">
                {doc.title}
              </h1>
              <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">{doc.intro}</p>
            </header>

            <div className="space-y-8">
              {doc.sections.map((s) => {
                const id = headingToId(s.heading);
                return (
                  <section key={s.heading} id={id} className="scroll-mt-24">
                    <h2 className="group font-display text-lg font-semibold text-foreground md:text-xl">
                      <a
                        href={`#${id}`}
                        className="inline-flex items-baseline gap-2 hover:text-foreground"
                      >
                        {s.heading}
                        <span
                          aria-hidden
                          className="text-ink-subtle opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          #
                        </span>
                      </a>
                    </h2>
                    <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink-muted">
                      {s.paragraphs.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>

            {/* Cross-link и контакт */}
            <div className="mt-12 flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Mail
                  className="mt-0.5 h-4 w-4 flex-none text-ink-subtle"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <div className="text-sm text-ink-muted">
                  Вопросы по документу — пишите на{" "}
                  <a
                    href="mailto:legal@botme.ru"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    legal@botme.ru
                  </a>
                  .
                </div>
              </div>
              <Link
                to={pairTo}
                className="inline-flex items-center gap-1.5 self-start rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-muted"
              >
                {pairLabel}
                <ChevronRight className="h-3 w-3" strokeWidth={1.5} aria-hidden />
              </Link>
            </div>
          </article>

          {/* Sticky TOC */}
          <aside className="hidden lg:col-span-4 lg:block xl:col-span-3">
            <div className="sticky top-24">
              <div className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
                Разделы
              </div>
              <ul className="mt-3 space-y-1.5">
                {doc.sections.map((s) => {
                  const id = headingToId(s.heading);
                  return (
                    <li key={id}>
                      <a
                        href={`#${id}`}
                        className={cn(
                          "block rounded-md px-2 py-1 text-sm text-ink-muted transition-colors",
                          "hover:bg-surface-muted hover:text-foreground",
                        )}
                      >
                        {s.heading}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        </div>
      </Container>
    </Section>
  );
}
