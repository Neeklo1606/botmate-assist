/**
 * / — главная страница botme (dark v2 umbrella).
 * Сборка из секций. Без бизнес-логики.
 */
import { createFileRoute } from "@tanstack/react-router";
import { HeroHome } from "@/components/home/HeroHome";
import { TrustStripHome } from "@/components/home/TrustStripHome";
import { ProductsHome } from "@/components/home/ProductsHome";
import { HowItWorksHome } from "@/components/home/HowItWorksHome";
import { WhyHome } from "@/components/home/WhyHome";
import { StatsHome } from "@/components/home/StatsHome";
import { FinalCtaHome } from "@/components/home/FinalCtaHome";
import { buildPageMeta, canonicalLink } from "@/lib/seo";

export const Route = createFileRoute("/_marketing/")({
  head: () => ({
    meta: buildPageMeta({
      title: "botme — твой AI-помощник для бизнеса",
      description:
        "Один помощник, три инструмента: AI-ассистент для клиентов, медиа-студия для контента, конструктор сайтов. Запуск за 3 дня.",
      path: "/",
    }),
    links: [canonicalLink("/")],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div style={{ background: "var(--bg-base)" }}>
      <HeroHome />
      <TrustStripHome />
      <ProductsHome />
      <HowItWorksHome />
      <WhyHome />
      <StatsHome />
      <FinalCtaHome />
    </div>
  );
}
