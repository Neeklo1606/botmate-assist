/**
 * Главный лендинг botme.
 * Структура: Hero → Trust → How → Features → Channels → Scenarios →
 *            Demo (dark) → Benefits → Launch → Pricing → Cases → FAQ → FinalCTA (dark).
 *
 * Каждая секция — атомарный компонент в /components/landing/sections/.
 * Данные тянутся через хуки → repository.
 */
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
import { PricingSection } from "@/components/landing/sections/pricing-section";
import { CasesSection } from "@/components/landing/sections/cases-section";
import { FaqSection } from "@/components/landing/sections/faq-section";
import { FinalCTA } from "@/components/landing/sections/final-cta";

export const Route = createFileRoute("/_marketing/")({
  head: () => ({
    meta: [
      { title: "botme: AI-ассистент, который не теряет ваших клиентов" },
      {
        name: "description",
        content:
          "Подключаем AI-ассистента к Telegram, сайту, Avito и CRM за 3 дня. Отвечает за 7 секунд, квалифицирует лида, доводит до сделки.",
      },
      { property: "og:title", content: "botme: AI-ассистент, который не теряет ваших клиентов" },
      {
        property: "og:description",
        content: "Подключаем AI-ассистента к Telegram, сайту, Avito и CRM за 3 дня.",
      },
    ],
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
      <PricingSection />
      <CasesSection />
      <FaqSection />
      <FinalCTA />
    </>
  );
}
