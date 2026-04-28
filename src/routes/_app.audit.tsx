import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { ComingSoon } from "@/components/app/coming-soon";

export const Route = createFileRoute("/_app/audit")({
  component: () => (
    <ComingSoon
      title="Аудит"
      description="История действий пользователей и системных событий"
      icon={ShieldCheck}
    />
  ),
});
