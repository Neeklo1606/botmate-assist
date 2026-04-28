import { createFileRoute } from "@tanstack/react-router";
import { Rocket } from "lucide-react";
import { ComingSoon } from "@/components/app/coming-soon";

export const Route = createFileRoute("/_app/onboarding")({
  component: () => (
    <ComingSoon
      title="Добро пожаловать в Botme"
      description="Пройдём короткий онбординг и подключим первый канал"
      icon={Rocket}
    />
  ),
});
