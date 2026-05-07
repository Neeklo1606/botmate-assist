import { Link, createFileRoute } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/onboarding/complete")({
  head: () => ({
    meta: [
      { title: "Бриф сохранён · botme" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CompletePage,
});

function CompletePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-base px-6 text-center">
      <CheckCircle2 className="h-16 w-16 text-accent" strokeWidth={1.5} />
      <h1 className="mt-6 font-display text-[36px] font-semibold leading-[1.1] tracking-[-0.03em] text-ink-dark md:text-[48px]">
        Готово!
      </h1>
      <p className="mt-4 max-w-[480px] text-[16px] leading-[1.55] text-ink-dark-muted md:text-[18px]">
        В следующем шаге создадим аккаунт. Coming soon.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex h-11 items-center rounded-[10px] border border-border-dark-strong bg-transparent px-6 text-[14px] text-ink-dark transition-colors hover:bg-bg-soft"
      >
        На главную
      </Link>
    </div>
  );
}
