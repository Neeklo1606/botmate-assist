import { createFileRoute } from "@tanstack/react-router";
import { Plug } from "lucide-react";
import { ComingSoon } from "@/components/app/coming-soon";

export const Route = createFileRoute("/_app/app-integrations")({
  component: () => (
    <ComingSoon
      title="Интеграции"
      description="CRM, мессенджеры, телефония и другие сервисы"
      icon={Plug}
    />
  ),
});
