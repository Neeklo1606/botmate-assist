/**
 * ShowcaseControls — caption, pause/play, dot-indicator.
 */
import { Pause, Play } from "lucide-react";
import type { ShowcaseTab } from "./ShowcaseTabs";

const CAPTIONS: Record<ShowcaseTab, string> = {
  assistant: "Превью кабинета · Ассистент",
  media: "Превью студии · Медиа",
  site: "Превью конструктора · Сайт",
};

const ORDER: ShowcaseTab[] = ["assistant", "media", "site"];

interface Props {
  activeTab: ShowcaseTab;
  isPaused: boolean;
  onTogglePause: () => void;
  onSelect: (tab: ShowcaseTab) => void;
}

export function ShowcaseControls({ activeTab, isPaused, onTogglePause, onSelect }: Props) {
  return (
    <div
      className="mt-4 flex flex-col items-center justify-between gap-2 sm:flex-row"
    >
      <div className="font-mono text-[12px]" style={{ color: "var(--ink-dark-subtle)" }}>
        {CAPTIONS[activeTab]}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={isPaused ? "Продолжить автоплей" : "Пауза автоплея"}
          aria-pressed={isPaused}
          onClick={onTogglePause}
          className="rounded p-1 transition-colors hover:opacity-80"
          style={{ color: "var(--ink-dark-subtle)" }}
        >
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>
        <span className="font-mono text-[11px]" style={{ color: "var(--ink-dark-subtle)" }}>
          Авто
        </span>
        <div className="ml-3 flex items-center gap-1.5">
          {ORDER.map((t) => (
            <button
              key={t}
              type="button"
              aria-label={`Показать ${t}`}
              onClick={() => onSelect(t)}
              className="h-1.5 w-1.5 rounded-full transition-all"
              style={{
                background: t === activeTab ? "var(--accent)" : "var(--ink-dark-subtle)",
                transform: t === activeTab ? "scale(1.2)" : "scale(1)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
