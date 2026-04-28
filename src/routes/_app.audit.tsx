import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { ComingSoon } from "@/components/app/coming-soon";

export const Route = createFileRoute("/_app/audit")({
  head: () => ({
    meta: [{ title: "Аудит — botme" }],
  }),
  component: () => (
    <ComingSoon
      title="Аудит"
      description="История действий пользователей и системных событий"
      icon={ShieldCheck}
    />
  ),
});
