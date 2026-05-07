/**
 * /site — заглушка под будущий продукт «Сайт» (промпт 5).
 */
import { Link, createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { buildPageMeta, canonicalLink } from "@/lib/seo";

export const Route = createFileRoute("/_marketing/site")({
  head: () => ({
    meta: buildPageMeta({
      title: "Сайт botme — скоро",
      description: "AI-генератор лендингов. Скоро.",
      path: "/site",
    }),
    links: [canonicalLink("/site")],
  }),
  component: SiteSoon,
});

function SiteSoon() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-24 text-center">
      <div className="text-xs uppercase tracking-wide text-ink-subtle">botme · site</div>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Скоро</h1>
      <p className="mt-3 max-w-md text-ink-muted">
        Этот продукт появится в следующих обновлениях.
      </p>
      <Button asChild variant="outline" size="md" className="mt-6">
        <Link to="/assistant">Открыть Assistant</Link>
      </Button>
    </section>
  );
}
