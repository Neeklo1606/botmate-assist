import { createFileRoute } from "@tanstack/react-router";
import { WizardLayout } from "@/components/onboarding/WizardLayout";
import { getOnboardingConfig } from "@/lib/onboarding/configs";

export const Route = createFileRoute("/onboarding/site")({
  head: () => ({
    meta: [
      { title: "Бриф · Сайт botme" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SiteOnboardingPage,
});

function SiteOnboardingPage() {
  return <WizardLayout config={getOnboardingConfig("site")} />;
}
