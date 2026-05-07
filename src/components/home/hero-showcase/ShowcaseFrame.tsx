/**
 * ShowcaseFrame — браузерная рамка вокруг mock-контента.
 */
import type { ReactNode } from "react";
import { Lock, Search, Bell, User } from "lucide-react";
import type { ShowcaseTab } from "./ShowcaseTabs";

const URLS: Record<ShowcaseTab, string> = {
  assistant: "botme.app/assistant/inbox",
  media: "botme.app/media/studio",
  site: "botme.app/site/builder",
};

export function ShowcaseFrame({ activeTab, children }: { activeTab: ShowcaseTab; children: ReactNode }) {
  return (
    <div
      role="tabpanel"
      id="showcase-panel"
      aria-labelledby={`tab-${activeTab}`}
      className="relative overflow-hidden rounded-[16px] sm:rounded-[20px]"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-dark)",
        height: "var(--frame-h)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px rgba(255,255,255,0.02), 0 30px 80px -20px rgba(0,0,0,0.5), 0 80px 100px -50px rgba(197,240,74,0.08)",
      }}
    >
      {/* Browser bar */}
      <div
        className="flex h-9 shrink-0 items-center gap-2 border-b px-3.5"
        style={{ borderColor: "var(--border-dark)", background: "var(--bg-soft)" }}
      >
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full opacity-50" style={{ background: "#FF5F57" }} />
          <span className="h-2.5 w-2.5 rounded-full opacity-50" style={{ background: "#FEBC2E" }} />
          <span className="h-2.5 w-2.5 rounded-full opacity-50" style={{ background: "#28C840" }} />
        </div>

        <div className="flex flex-1 justify-center">
          <span
            className="inline-flex items-center gap-1.5 rounded-md font-mono text-[11px]"
            style={{
              background: "var(--bg-base)",
              border: "1px solid var(--border-dark)",
              color: "var(--ink-dark-muted)",
              padding: "4px 10px",
            }}
          >
            <Lock className="h-2.5 w-2.5" strokeWidth={2} style={{ color: "var(--ink-dark-subtle)" }} />
            {URLS[activeTab]}
          </span>
        </div>

        <div className="flex items-center gap-3.5">
          <Search className="h-3 w-3" strokeWidth={1.75} style={{ color: "var(--ink-dark-subtle)" }} />
          <Bell className="h-3 w-3" strokeWidth={1.75} style={{ color: "var(--ink-dark-subtle)" }} />
          <User className="h-3 w-3" strokeWidth={1.75} style={{ color: "var(--ink-dark-subtle)" }} />
        </div>
      </div>

      {/* Content area */}
      <div className="relative h-[calc(100%-2.25rem)] overflow-hidden">{children}</div>

      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
        style={{
          background:
            "radial-gradient(ellipse 60% 100% at 50% 100%, rgba(197,240,74,0.06) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}
