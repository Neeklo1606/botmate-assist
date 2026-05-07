/**
 * _onboarding — pathless layout для брифов. Без SiteHeader/SiteFooter.
 */
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_onboarding")({
  component: OnboardingLayout,
});

function OnboardingLayout() {
  return (
    <div className="min-h-screen bg-bg-base text-ink-dark">
      <Outlet />
    </div>
  );
}
