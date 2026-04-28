import { createFileRoute } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import { ComingSoon } from "@/components/app/coming-soon";

export const Route = createFileRoute("/_app/api-keys")({
  component: () => (
    <ComingSoon
      title="API-ключи"
      description="Токены доступа для интеграций по REST и Webhook"
      icon={KeyRound}
    />
  ),
});
