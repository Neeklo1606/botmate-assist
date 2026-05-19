import { createFileRoute } from "@tanstack/react-router";
import { WizardLayout } from "@/components/onboarding/WizardLayout";
import { getOnboardingConfig } from "@/lib/onboarding/configs";

export const Route = createFileRoute("/onboarding/assistant")({
  head: () => ({
    meta: [
      { title: "Бриф · Ассистент botme" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AssistantOnboardingPage,
});

function AssistantOnboardingPage() {
  return <WizardLayout config={getOnboardingConfig("assistant")} />;
}
