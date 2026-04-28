import { createFileRoute } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { ComingSoon } from "@/components/app/coming-soon";

export const Route = createFileRoute("/_app/calls")({
  component: () => (
    <ComingSoon
      title="Звонки"
      description="Голосовые сценарии и журнал звонков"
      icon={Phone}
    />
  ),
});
