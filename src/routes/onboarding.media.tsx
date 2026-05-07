import { createFileRoute } from "@tanstack/react-router";
import { WizardLayout } from "@/components/onboarding/WizardLayout";
import { getOnboardingConfig } from "@/lib/onboarding/configs";

export const Route = createFileRoute("/onboarding/media")({
  head: () => ({
    meta: [
      { title: "Бриф · Медиа botme" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MediaOnboardingPage,
});

function MediaOnboardingPage() {
  return <WizardLayout config={getOnboardingConfig("media")} />;
}
