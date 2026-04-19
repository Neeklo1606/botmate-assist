/**
 * Главный лендинг botme.
 * Структура: Hero → Trust → How → Features → Channels → Scenarios →
 *            Demo (dark) → Benefits → Launch → Pricing → Cases → FAQ → FinalCTA (dark).
 *
 * Каждая секция — атомарный компонент в /components/landing/sections/.
 * Данные тянутся через хуки → repository.
 *
 * Performance: ниже фолда (Pricing, Cases, FAQ) — React.lazy + Suspense
 * с фиксированными скелетами одинаковой высоты, чтобы избежать CLS.
 */
import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { Hero } from "@/components/landing/sections/hero";
import { TrustStrip } from "@/components/landing/sections/trust-strip";
import { HowItWorks } from "@/components/landing/sections/how-it-works";
import { FeaturesSection } from "@/components/landing/sections/features-section";
import { ChannelsSection } from "@/components/landing/sections/channels-section";
import { ScenariosSection } from "@/components/landing/sections/scenarios-section";
import { DemoSection } from "@/components/landing/sections/demo-section";
import { BenefitsSection } from "@/components/landing/sections/benefits-section";
import { LaunchSection } from "@/components/landing/sections/launch-section";
import { FinalCTA } from "@/components/landing/sections/final-cta";

import { buildPageMeta, canonicalLink } from "@/lib/seo";

// Below-the-fold — грузим чанками только когда нужно.
const PricingSection = lazy(() =>
  import("@/components/landing/sections/pricing-section").then((m) => ({
    default: m.PricingSection,
  })),
);
const CasesSection = lazy(() =>
  import("@/components/landing/sections/cases-section").then((m) => ({
    default: m.CasesSection,
  })),
);
const FaqSection = lazy(() =>
  import("@/components/landing/sections/faq-section").then((m) => ({
    default: m.FaqSection,
  })),
);

/**
 * SectionSkeleton — нейтральный плейсхолдер фиксированной высоты,
 * чтобы при подгрузке lazy-секции не было layout-shift.
 * tone="default" для Pricing/FAQ, "muted" для Cases — совпадает с реальными секциями.
 */
function SectionSkeleton({ tone = "default", minH = 560 }: { tone?: "default" | "muted"; minH?: number }) {
  return (
    <div
      aria-hidden
      className={tone === "muted" ? "bg-surface-muted" : "bg-background"}
      style={{ minHeight: minH }}
    />
  );
}

export const Route = createFileRoute("/_marketing/")({
  head: () => ({
    meta: buildPageMeta({
      title: "botme — AI-ассистент, который не теряет ваших клиентов",
      description:
        "Подключаем AI-ассистента к Telegram, сайту, Avito и CRM за 3 дня. Отвечает за 7 секунд, квалифицирует лида, доводит до сделки.",
      path: "/",
    }),
    links: [canonicalLink("/")],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <FeaturesSection />
      <ChannelsSection />
      <ScenariosSection />
      <DemoSection />
      <BenefitsSection />
      <LaunchSection />

      <Suspense fallback={<SectionSkeleton tone="default" minH={720} />}>
        <PricingSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton tone="muted" minH={560} />}>
        <CasesSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton tone="default" minH={560} />}>
        <FaqSection />
      </Suspense>

      <FinalCTA />
    </>
  );
}
