/**
 * /site — лендинг продукта «Конструктор сайтов» botme. Тёмная палитра v2.
 */
import { createFileRoute } from "@tanstack/react-router";
import { SiteHero } from "@/components/site/SiteHero";
import { SiteHowItWorks } from "@/components/site/SiteHowItWorks";
import { SiteTemplates } from "@/components/site/SiteTemplates";
import { SiteFeatures } from "@/components/site/SiteFeatures";
import { SiteSpeedComparison } from "@/components/site/SiteSpeedComparison";
import { SitePricing } from "@/components/site/SitePricing";
import { SiteFaq } from "@/components/site/SiteFaq";
import { SiteFinalCta } from "@/components/site/SiteFinalCta";
import { buildPageMeta, canonicalLink } from "@/lib/seo";

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Конструктор сайтов botme",
  description: "AI-генератор лендингов по брифу",
  brand: "botme",
  offers: [
    { "@type": "Offer", name: "Лайт", price: "4900", priceCurrency: "RUB" },
    { "@type": "Offer", name: "Бизнес", price: "9900", priceCurrency: "RUB" },
    { "@type": "Offer", name: "Студия", price: "24900", priceCurrency: "RUB" },
  ],
};

export const Route = createFileRoute("/_marketing/site")({
  head: () => ({
    meta: buildPageMeta({
      title: "Конструктор сайтов botme — лендинг за 10 минут",
      description:
        "AI собирает лендинг по короткому брифу. Свой домен, SSL, аналитика, форма в CRM. От 4 900 ₽/мес.",
      path: "/site",
    }),
    links: [canonicalLink("/site")],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(JSON_LD),
      },
    ],
  }),
  component: SitePage,
});

function SitePage() {
  return (
    <main style={{ background: "var(--bg-base)" }}>
      <SiteHero />
      <SiteHowItWorks />
      <SiteTemplates />
      <SiteFeatures />
      <SiteSpeedComparison />
      <SitePricing />
      <SiteFaq />
      <SiteFinalCta />
    </main>
  );
}
