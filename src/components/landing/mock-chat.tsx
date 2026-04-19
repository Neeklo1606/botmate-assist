/**
 * MockChat — публичный wrapper.
 *
 * Зачем lazy:
 *  — Реализация (mock-chat-impl) тянет sonner toast, состояния, эффекты.
 *  — На лендинге чат виден сразу, но на /scenarios/$niche он ниже фолда —
 *    lazy chunk не блокирует первый рендер.
 *  — Skeleton имеет ту же фиксированную высоту (440px / md:580px), что и
 *    реальный чат → нулевой layout shift при подгрузке.
 */
import { lazy, Suspense } from "react";
import { cn } from "@/lib/utils";
import type { MockChatProps } from "./mock-chat-types";

const MockChatImpl = lazy(() => import("./mock-chat-impl"));

export function MockChat(props: MockChatProps) {
  return (
    <Suspense fallback={<MockChatSkeleton variant={props.variant} className={props.className} />}>
      <MockChatImpl {...props} />
    </Suspense>
  );
}

function MockChatSkeleton({
  variant = "light",
  className,
}: {
  variant?: "light" | "dark";
  className?: string;
}) {
  const isDark = variant === "dark";
  return (
    <div
      aria-hidden
      className={cn(
        "flex h-[440px] max-h-[60vh] flex-col overflow-hidden rounded-xl border shadow-lift md:h-[580px] md:max-h-none",
        isDark ? "border-border-strong/40 bg-foreground" : "border-border bg-surface",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-16 flex-none items-center gap-3 border-b px-4",
          isDark ? "border-border-strong/30" : "border-border",
        )}
      >
        <div
          className={cn(
            "h-9 w-9 animate-pulse rounded-full",
            isDark ? "bg-background/10" : "bg-surface-muted",
          )}
        />
        <div className="flex-1 space-y-2">
          <div
            className={cn(
              "h-3 w-32 animate-pulse rounded",
              isDark ? "bg-background/10" : "bg-surface-muted",
            )}
          />
          <div
            className={cn(
              "h-2 w-20 animate-pulse rounded",
              isDark ? "bg-background/10" : "bg-surface-muted",
            )}
          />
        </div>
      </div>
      <div className={cn("flex-1", isDark ? "bg-foreground" : "bg-surface-muted/40")} />
      <div
        className={cn(
          "h-16 flex-none border-t",
          isDark ? "border-border-strong/30" : "border-border",
        )}
      />
    </div>
  );
}
