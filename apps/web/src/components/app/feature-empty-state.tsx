import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FeatureEmptyState(props: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
}) {
  const Icon = props.icon;
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <Icon className="h-12 w-12 text-white/25" strokeWidth={1.5} />
      <h1 className="text-xl font-semibold text-white">{props.title}</h1>
      <p className="max-w-lg text-sm text-white/50">{props.description}</p>
      {props.actionLabel && props.actionTo ?
        <Button asChild variant="brand" size="sm">
          <Link to={props.actionTo}>{props.actionLabel}</Link>
        </Button>
      : null}
    </div>
  );
}
