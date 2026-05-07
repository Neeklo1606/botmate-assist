/**
 * /assistant — продуктовая страница «Ассистент botme».
 * Полный лендинг (раньше был на /). Светлая палитра, hash-навигация по секциям.
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

function SectionSkeleton({ tone = "default", minH = 560 }: { tone?: "default" | "muted"; minH?: number }) {
  return (
    <div
      aria-hidden
      className={tone === "muted" ? "bg-surface-muted" : "bg-background"}
      style={{ minHeight: minH }}
    />
  );
}

export const Route = createFileRoute("/_marketing/assistant")({
  head: () => ({
    meta: buildPageMeta({
      title: "Ассистент botme — AI, который не теряет клиентов",
      description:
        "AI-ассистент для Telegram, сайта, Avito и CRM. Запуск за 3 дня. Отвечает за 7 секунд, квалифицирует лида.",
      path: "/assistant",
    }),
    links: [canonicalLink("/assistant")],
  }),
  component: AssistantPage,
});

function AssistantPage() {
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
