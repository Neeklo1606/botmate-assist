/**
 * Responsive layout primitives — единые паттерны для кабинета и лендинга.
 * Предотвращают некорректные переносы в бейджах, счётчиках и toolbar-строках.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

/** Заголовок секции + действие справа (стек на узких экранах). */
export function ToolbarRow({
  className,
  children,
  align = "center",
}: {
  className?: string;
  children: React.ReactNode;
  align?: "center" | "start";
}) {
  return (
    <div
      className={cn(
        "toolbar-row",
        align === "start" && "toolbar-row-start",
        className,
      )}
    >
      {children}
    </div>
  );
}


/** Горизонтальная группа: заголовок, бейдж, метки. */
export function Cluster({
  className,
  nowrap,
  children,
}: {
  className?: string;
  nowrap?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2",
        nowrap ? "flex-nowrap" : "flex-wrap gap-y-1",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Счётчик + подпись без разрыва внутри (например «0 посетителей»). */
export function CountBadge({
  count,
  label,
  className,
  style,
}: {
  count: number | string;
  label: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={cn(
        "badge-pill inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap tabular-nums",
        className,
      )}
      style={style}
    >
      <span>{count}</span>
      <span>{label}</span>
    </span>
  );
}

/** Ссылка/кнопка в toolbar — не сжимается и не переносится. */
export function ToolbarAction({
  className,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: React.ReactNode }) {
  return (
    <a
      className={cn(
        "inline-flex shrink-0 items-center self-start whitespace-nowrap sm:self-center",
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
}
