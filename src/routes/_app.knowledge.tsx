import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { ComingSoon } from "@/components/app/coming-soon";

export const Route = createFileRoute("/_app/knowledge")({
  component: () => (
    <ComingSoon
      title="База знаний"
      description="Загруженные документы, сайты и FAQ для ваших ассистентов"
      icon={BookOpen}
    />
  ),
});
