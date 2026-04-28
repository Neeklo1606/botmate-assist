/**
 * SiteFooter — финальный футер маркетинга. 4 колонки на desktop.
 */
import { Link } from "@tanstack/react-router";
import { Container } from "@/components/layout/container";
import { BotmeLogo } from "@/components/brand/botme-logo";
import { useLocale } from "@/lib/i18n/locale";

export function SiteFooter() {
  const { t } = useLocale();

  const productLinks = [
    { to: "/features" as const, label: t("footer.linkFeatures") },
    { to: "/integrations" as const, label: t("footer.linkIntegrations") },
    { to: "/scenarios" as const, label: t("footer.linkScenarios") },
    { to: "/pricing" as const, label: t("footer.linkPricing") },
    { to: "/first-100" as const, label: t("footer.linkFirst100") },
  ];

  const companyLinks = [
    { to: "/about" as const, label: t("footer.linkAbout") },
    { to: "/cases" as const, label: t("footer.linkCases") },
    { to: "/faq" as const, label: t("footer.linkFaq") },
    { to: "/contacts" as const, label: t("footer.linkContacts") },
  ];

  const legalLinks = [
    { to: "/legal/privacy" as const, label: t("footer.linkPrivacy") },
    { to: "/legal/offer" as const, label: t("footer.linkOffer") },
  ];

  return (
    <footer className="border-t border-border bg-background">
      <Container>
        <div className="grid gap-10 py-12 md:grid-cols-12 md:py-16">
          <div className="md:col-span-4">
            <BotmeLogo />
            <p className="mt-3 max-w-[280px] text-sm text-ink-muted">{t("footer.tagline")}</p>
            <div className="mt-6 space-y-1.5 text-sm">
              <div className="text-ink-muted">
                Telegram:{" "}
                <a
                  className="text-foreground underline-offset-4 hover:underline"
                  href="https://t.me/botme_support"
                >
                  @botme_support
                </a>
              </div>
              <div className="text-ink-muted">
                Email:{" "}
                <a
                  className="text-foreground underline-offset-4 hover:underline"
                  href="mailto:hello@botme.ru"
                >
                  hello@botme.ru
                </a>
              </div>
            </div>
          </div>

          <FooterCol title={t("footer.product")} items={productLinks} />
          <FooterCol title={t("footer.company")} items={companyLinks} />
          <FooterCol title={t("footer.legal")} items={legalLinks} />
        </div>

        <div className="flex flex-col items-start justify-between gap-3 border-t border-border py-6 text-xs text-ink-subtle md:flex-row md:items-center">
          <div>
            © {new Date().getFullYear()} botme · {t("footer.copyright")}
          </div>
          <div>{t("footer.legalEntity")}</div>
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
