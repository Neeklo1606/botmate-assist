import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { ComingSoon } from "@/components/app/coming-soon";

export const Route = createFileRoute("/_app/chat")({
  component: () => (
    <ComingSoon
      title="Чаты"
      description="Живые диалоги ассистентов со всеми вашими клиентами"
      icon={MessageCircle}
    />
  ),
});
