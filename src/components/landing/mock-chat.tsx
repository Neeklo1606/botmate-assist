/**
 * MockChat — статичная mock-переписка в стиле мессенджера.
 * Используется в Hero, Demo и посадочных по нишам.
 * Без интерактива, без таймеров — чисто визуальная демонстрация.
 */
import { Send } from "lucide-react";
import type { ChatMessage } from "@/types/entities";
import { cn } from "@/lib/utils";

interface MockChatProps {
  title?: string;
  subtitle?: string;
  messages: ChatMessage[];
  variant?: "light" | "dark";
  className?: string;
}

export function MockChat({
  title = "Ассистент botme",
  subtitle = "онлайн",
  messages,
  variant = "light",
  className,
}: MockChatProps) {
  const isDark = variant === "dark";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border shadow-lift",
        isDark ? "border-border-strong/40 bg-foreground" : "border-border bg-surface",
        className,
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-3 border-b px-4 py-3",
          isDark ? "border-border-strong/30" : "border-border",
        )}
      >
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold",
            isDark ? "bg-accent text-accent-ink" : "bg-foreground text-background",
          )}
          aria-hidden
        >
          bm
                   </div>
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              "text-sm font-medium leading-tight truncate",
              isDark ? "text-background" : "text-foreground",
            )}
          >
            {title}
          </div>
          <div
            className={cn(
              "mt-0.5 inline-flex items-center gap-1.5 text-xs",
              isDark ? "text-background/60" : "text-muted-foreground",
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
            {subtitle}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        className={cn(
          "space-y-2.5 px-4 py-5",
          isDark ? "bg-foreground" : "bg-surface-muted/40",
        )}
      >
        {messages.map((msg) => {
          const isBot = msg.role === "bot";
          return (
            <div
              key={msg.id}
              className={cn("flex w-full", isBot ? "justify-start" : "justify-end")}
            >
              <div className="max-w-[78%]">
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-2 text-[14px] leading-snug",
                    isBot
                      ? isDark
                        ? "rounded-tl-sm bg-background/10 text-background"
                        : "rounded-tl-sm bg-surface text-foreground border border-border"
                      : isDark
                        ? "rounded-tr-sm bg-accent text-accent-ink"
                        : "rounded-tr-sm bg-foreground text-background",
                  )}
                >
                  {msg.text}
                </div>
                {msg.time ? (
                  <div
                    className={cn(
                      "mt-1 text-[11px] tabular px-1",
                      isBot ? "text-left" : "text-right",
                      isDark ? "text-background/40" : "text-ink-subtle",
                    )}
                  >
                    {msg.time}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer (decorative) */}
      <div
        className={cn(
          "flex items-center gap-2 border-t px-3 py-2.5",
          isDark ? "border-border-strong/30 bg-foreground" : "border-border bg-surface",
        )}
      >
        <div
          className={cn(
            "flex-1 rounded-md px-3 py-2 text-[13px]",
            isDark ? "bg-background/10 text-background/40" : "bg-surface-muted text-ink-subtle",
          )}
        >
          Напишите сообщение…
                   </div>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Отправить"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
            isDark
              ? "bg-accent text-accent-ink hover:bg-accent-hover"
              : "bg-foreground text-background hover:bg-primary-hover",
          )}
        >
          <Send className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
