/**
 * SiteFooter — финальный футер маркетинга. 4 колонки на desktop.
 */
import { Link } from "@tanstack/react-router";
import { Container } from "@/components/layout/container";
import { BotmeLogo } from "@/components/brand/botme-logo";
import { useLocale } from "@/lib/i18n/locale";

interface SiteFooterProps {
  variant?: "light" | "dark";
}

export function SiteFooter({ variant = "light" }: SiteFooterProps = {}) {
  const { t } = useLocale();
  const isDark = variant === "dark";

  const productLinks = [
    { to: "/assistant" as const, hash: "features", label: t("footer.linkFeatures") },
    { to: "/integrations" as const, hash: undefined, label: t("footer.linkIntegrations") },
    { to: "/assistant" as const, hash: "scenarios", label: t("footer.linkScenarios") },
    { to: "/assistant" as const, hash: "pricing-plans", label: t("footer.linkPricing") },
    { to: "/first-100" as const, hash: undefined, label: t("footer.linkFirst100") },
  ];

  const companyLinks = [
    { to: "/about" as const, hash: undefined, label: t("footer.linkAbout") },
    { to: "/assistant" as const, hash: "cases", label: t("footer.linkCases") },
    { to: "/assistant" as const, hash: "faq", label: t("footer.linkFaq") },
    { to: "/contacts" as const, hash: undefined, label: t("footer.linkContacts") },
  ];

  const legalLinks = [
    { to: "/legal/privacy" as const, hash: undefined, label: t("footer.linkPrivacy") },
    { to: "/legal/offer" as const, hash: undefined, label: t("footer.linkOffer") },
  ];

  return (
    <footer
      className="border-t"
      style={{
        background: isDark ? "var(--bg-base)" : undefined,
        borderColor: isDark ? "var(--border-dark)" : undefined,
      }}
    >
      <Container>
        <div className="grid gap-10 py-12 md:grid-cols-12 md:py-16">
          <div className="md:col-span-4">
            <BotmeLogo variant={isDark ? "dark" : "light"} />
            <p
              className="mt-3 max-w-[280px] text-sm"
              style={{ color: isDark ? "var(--ink-dark-muted)" : undefined }}
            >
              {t("footer.tagline")}
            </p>
            <div className="mt-6 space-y-1.5 text-sm">
              <div style={{ color: isDark ? "var(--ink-dark-muted)" : undefined }}>
                Telegram:{" "}
                <a
                  className="underline-offset-4 hover:underline"
                  style={{ color: isDark ? "var(--ink-dark)" : undefined }}
                  href="https://t.me/botme_support"
                >
                  @botme_support
                </a>
              </div>
              <div style={{ color: isDark ? "var(--ink-dark-muted)" : undefined }}>
                Email:{" "}
                <a
                  className="underline-offset-4 hover:underline"
                  style={{ color: isDark ? "var(--ink-dark)" : undefined }}
                  href="mailto:hello@botme.ru"
                >
                  hello@botme.ru
                </a>
              </div>
            </div>
          </div>

          <FooterCol title={t("footer.product")} items={productLinks} dark={isDark} />
          <FooterCol title={t("footer.company")} items={companyLinks} dark={isDark} />
          <FooterCol title={t("footer.legal")} items={legalLinks} dark={isDark} />
        </div>

        <div
          className="flex flex-col items-start justify-between gap-3 border-t py-6 text-xs md:flex-row md:items-center"
          style={{
            borderColor: isDark ? "var(--border-dark)" : undefined,
            color: isDark ? "var(--ink-dark-subtle)" : undefined,
          }}
        >
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
  dark = false,
}: {
  title: string;
  items: ReadonlyArray<{ to: string; hash?: string; label: string }>;
  dark?: boolean;
}) {
  return (
    <div className="md:col-span-2">
      <div
        className="mb-3 text-xs font-medium uppercase tracking-wide"
        style={{ color: dark ? "var(--ink-dark-subtle)" : undefined }}
      >
        {title}
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              to={item.to}
              hash={item.hash}
              className="text-sm transition-colors"
              style={{
                color: dark ? "var(--ink-dark-muted)" : undefined,
              }}
              onMouseEnter={(e) => {
                if (dark) e.currentTarget.style.color = "var(--ink-dark)";
              }}
              onMouseLeave={(e) => {
                if (dark) e.currentTarget.style.color = "var(--ink-dark-muted)";
              }}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
