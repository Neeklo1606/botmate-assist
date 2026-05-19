/**
 * MockChat — статичная mock-переписка в стиле мессенджера.
 * Используется в Hero, Demo и посадочных по нишам.
 *
 * UX: чат не «прыгает» — фиксированная высота с внутренним скроллом.
 * Поле ввода disabled. На mobile тап по полю → toast с CTA «оставить заявку».
 */
import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import type { ChatMessage } from "@/types/entities";
import { cn } from "@/lib/utils";
import type { MockChatProps } from "./mock-chat-types";

export default function MockChatImpl({
  title = "Ассистент botme",
  subtitle = "онлайн",
  messages,
  variant = "light",
  className,
}: MockChatProps) {
  const isDark = variant === "dark";

  // Typing indicator: показать один раз перед последним сообщением бота.
  // Состояние: "typing" → виден индикатор, последнее сообщение скрыто.
  //            "done"   → индикатор скрыт, все сообщения видны.
  const lastIsBot = messages.length > 0 && messages[messages.length - 1].role === "bot";
  const [phase, setPhase] = useState<"typing" | "done">(lastIsBot ? "typing" : "done");

  useEffect(() => {
    if (!lastIsBot) return;
    const t = setTimeout(() => setPhase("done"), 1400);
    return () => clearTimeout(t);
  }, [lastIsBot]);

  const visibleMessages =
    lastIsBot && phase === "typing" ? messages.slice(0, -1) : messages;

  const handleDemoTap = () => {
    toast("Это демо-режим", {
      description: "Чтобы попробовать настоящего ассистента — оставьте заявку.",
      action: {
        label: "Оставить заявку",
        onClick: () => {
          const el = document.getElementById("demo");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        },
      },
    });
  };

  return (
    <div
      className={cn(
        "flex h-[440px] max-h-[60vh] flex-col overflow-hidden rounded-xl border shadow-lift md:h-[580px] md:max-h-none",
        isDark ? "border-border-strong/40 bg-foreground" : "border-border bg-surface",
        className,
      )}
    >
      {/* Header (fixed, 64px) */}
      <div
        className={cn(
          "flex h-16 flex-none items-center gap-3 border-b px-4",
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
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "truncate text-sm font-medium leading-tight",
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

      {/* Messages (flex-1, internal scroll) */}
      <div
        className={cn(
          "flex-1 space-y-2.5 overflow-y-auto px-4 py-5",
          isDark ? "bg-foreground" : "bg-surface-muted/40",
        )}
      >
        {visibleMessages.map((msg: ChatMessage) => {
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
                        : "rounded-tl-sm border border-border bg-surface text-foreground"
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
                      "mt-1 px-1 text-[11px] tabular-nums",
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

        {lastIsBot && phase === "typing" ? (
          <div className="flex w-full justify-start" aria-live="polite" aria-label="печатает">
            <div
              className={cn(
                "inline-flex items-center gap-1 rounded-2xl rounded-tl-sm px-3.5 py-2.5",
                isDark ? "bg-background/10" : "border border-border bg-surface",
              )}
            >
              <TypingDot isDark={isDark} delay="0ms" />
              <TypingDot isDark={isDark} delay="160ms" />
              <TypingDot isDark={isDark} delay="320ms" />
            </div>
          </div>
        ) : null}
      </div>

      {/* Composer — disabled, demo-mode (fixed, 64px) */}
      <div
        className={cn(
          "flex h-16 flex-none items-center gap-2 border-t px-3",
          isDark ? "border-border-strong/30 bg-foreground" : "border-border bg-surface",
        )}
      >
        <button
          type="button"
          onClick={handleDemoTap}
          className={cn(
            "flex-1 cursor-pointer rounded-md px-3 py-2 text-left text-[13px] transition-colors",
            isDark
              ? "bg-background/10 text-background/40 hover:bg-background/15"
              : "bg-surface-muted text-ink-subtle hover:bg-surface-muted/80",
          )}
        >
          Демо-режим. Попробуйте вашего ассистента.
        </button>
        <button
          type="button"
          onClick={handleDemoTap}
          aria-label="Это демо. Оставьте заявку."
          className={cn(
            "flex h-9 w-9 flex-none items-center justify-center rounded-md transition-colors",
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

function TypingDot({ isDark, delay }: { isDark: boolean; delay: string }) {
  return (
    <span
      className={cn(
        "inline-block h-1.5 w-1.5 animate-pulse rounded-full",
        isDark ? "bg-background/60" : "bg-ink-muted",
      )}
      style={{ animationDelay: delay, animationDuration: "1.1s" }}
    />
  );
}
