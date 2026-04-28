import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { ComingSoon } from "@/components/app/coming-soon";

export const Route = createFileRoute("/_app/visitors")({
  component: () => (
    <ComingSoon
      title="Посетители"
      description="Кто заходил, откуда и что спрашивал"
      icon={Users}
    />
  ),
});
