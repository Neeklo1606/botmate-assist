/**
 * Контейнер с консистентными горизонтальными отступами и max-width.
 * Используем вместо ad-hoc px/mx-auto классов в каждой секции.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "default" | "narrow" | "wide";
}

const sizeClass = {
  narrow: "max-w-[920px]",
  default: "max-w-[1200px]",
  wide: "max-w-[1320px]",
} as const;

export function Container({
  className,
  size = "default",
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn("container-px mx-auto w-full", sizeClass[size], className)}
      {...props}
    />
  );
}
