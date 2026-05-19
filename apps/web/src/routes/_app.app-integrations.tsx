import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/app-integrations")({
  beforeLoad: () => {
    throw redirect({ to: "/workspace", search: { tab: "integrations" } });
  },
});
