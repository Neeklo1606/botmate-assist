/**
 * /media — лендинг продукта «Медиа-студия» botme. Тёмная палитра v2.
 */
import { createFileRoute } from "@tanstack/react-router";
import { MediaHero } from "@/components/media/MediaHero";
import { MediaShowcase } from "@/components/media/MediaShowcase";
import { MediaFormats } from "@/components/media/MediaFormats";
import { MediaWorkflow } from "@/components/media/MediaWorkflow";
import { MediaUseCases } from "@/components/media/MediaUseCases";
import { MediaPricing } from "@/components/media/MediaPricing";
import { MediaFaq } from "@/components/media/MediaFaq";
import { MediaFinalCta } from "@/components/media/MediaFinalCta";
import { buildPageMeta, canonicalLink } from "@/lib/seo";

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Медиа-студия botme",
  description: "AI-генерация контента для соцсетей",
  brand: "botme",
  offers: [
    { "@type": "Offer", name: "Старт", price: "4900", priceCurrency: "RUB" },
    { "@type": "Offer", name: "Рост", price: "12900", priceCurrency: "RUB" },
    { "@type": "Offer", name: "Студия", price: "29900", priceCurrency: "RUB" },
  ],
};

export const Route = createFileRoute("/_marketing/media")({
  head: () => ({
    meta: buildPageMeta({
      title: "Медиа-студия botme — контент для соцсетей без дизайнера",
      description:
        "Посты, карусели, обложки сторис, баннеры. GPT генерирует тексты и визуалы под твой бренд. От 4 900 ₽/мес.",
      path: "/media",
    }),
    links: [canonicalLink("/media")],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(JSON_LD),
      },
    ],
  }),
  component: MediaPage,
});

function MediaPage() {
  return (
    <main style={{ background: "var(--bg-base)" }}>
      <MediaHero />
      <MediaShowcase />
      <MediaFormats />
      <MediaWorkflow />
      <MediaUseCases />
      <MediaPricing />
      <MediaFaq />
      <MediaFinalCta />
    </main>
  );
}
