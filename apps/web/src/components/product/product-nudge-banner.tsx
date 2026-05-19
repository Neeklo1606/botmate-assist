/**
 * Phase 12D — dismissible contextual nudge (localStorage).
 */
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, X } from "lucide-react";

export function ProductNudgeBanner(props: {
  storageKey: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaTo: string;
  tone?: "lime" | "amber" | "blue";
}) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(props.storageKey) === "1");
    } catch {
      setDismissed(false);
    }
  }, [props.storageKey]);

  if (dismissed) return null;

  const toneClass =
    props.tone === "amber" ? "border-amber-500/30 bg-amber-500/[0.07]"
    : props.tone === "blue" ? "border-sky-500/30 bg-sky-500/[0.07]"
    : "border-lime-500/25 bg-lime-500/[0.06]";

  return (
    <section
      className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${toneClass}`}
      aria-label={props.title}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{props.title}</p>
        <p className="mt-0.5 text-sm text-white/60">{props.body}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          to={props.ctaTo}
          className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3 py-2 text-sm font-medium text-black hover:bg-lime-300"
        >
          {props.ctaLabel}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
        <button
          type="button"
          className="rounded-lg p-2 text-white/50 hover:bg-white/5"
          aria-label="Закрыть"
          onClick={() => {
            try {
              localStorage.setItem(props.storageKey, "1");
            } catch {
              /* ignore */
            }
            setDismissed(true);
          }}
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </section>
  );
}
