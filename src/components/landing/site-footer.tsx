/**
 * SiteFooter — финальный футер маркетинга. 4 колонки на desktop.
 * Все ссылки через TanStack Link, contact-инфо — текстом.
 */
import { Link } from "@tanstack/react-router";
import { Container } from "@/components/layout/container";
import { BotmeLogo } from "@/components/brand/botme-logo";

const productLinks = [
  { to: "/features", label: "Возможности" },
  { to: "/integrations", label: "Каналы и интеграции" },
  { to: "/scenarios", label: "Сценарии под нишу" },
  { to: "/pricing", label: "Тарифы" },
  { to: "/first-100", label: "Первые 100" },
] as const;

const companyLinks = [
  { to: "/about", label: "О команде" },
  { to: "/cases", label: "Кейсы" },
  { to: "/faq", label: "FAQ" },
  { to: "/contacts", label: "Контакты" },
] as const;

const legalLinks = [
  { to: "/legal/privacy", label: "Политика конфиденциальности" },
  { to: "/legal/offer", label: "Договор-оферта" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <Container>
        <div className="grid gap-10 py-12 md:grid-cols-12 md:py-16">
          <div className="md:col-span-4">
            <BotmeLogo />
            <p className="mt-3 max-w-[280px] text-sm text-ink-muted">
              AI-ассистенты, которые отвечают клиентам, квалифицируют лидов и доводят до сделки.
            </p>
            <div className="mt-6 space-y-1.5 text-sm">
              <div className="text-ink-muted">
                Telegram:{" "}
                <a className="text-foreground underline-offset-4 hover:underline" href="https://t.me/botme_support">
                  @botme_support
                </a>
              </div>
              <div className="text-ink-muted">
                Email:{" "}
                <a className="text-foreground underline-offset-4 hover:underline" href="mailto:hello@botme.ru">
                  hello@botme.ru
                </a>
              </div>
            </div>
          </div>

          <FooterCol title="Продукт" items={productLinks} />
          <FooterCol title="Компания" items={companyLinks} />
          <FooterCol title="Документы" items={legalLinks} />
        </div>

        <div className="flex flex-col items-start justify-between gap-3 border-t border-border py-6 text-xs text-ink-subtle md:flex-row md:items-center">
          <div>© {new Date().getFullYear()} botme · продукт neeklo.studio</div>
          <div>ИП Клочко Никита Николаевич · ИНН 7806123456</div>
        </div>
      </Container>
    </footer>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: ReadonlyArray<{ to: string; label: string }>;
}) {
  return (
    <div className="md:col-span-2">
      <div className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-subtle">
        {title}
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              to={item.to}
              className="text-sm text-foreground/80 transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
