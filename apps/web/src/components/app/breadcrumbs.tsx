/**
 * Breadcrumbs — единые крошки для /app/*.
 * Источник правды: текущий pathname. Сегменты сопоставляются
 * со словарём ROUTE_LABELS, неизвестные сегменты отображаются как есть.
 */
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  app: "Приложение",
  assistants: "Ассистенты",
  knowledge: "База знаний",
  chat: "Чат",
  visitors: "Посетители",
  calls: "Звонки",
  leads: "Лиды",
  analytics: "Аналитика",
  team: "Команда",
  audit: "Аудит",
  runtime: "Runtime",
  settings: "Настройки",
  "api-keys": "API Ключи",
  "app-integrations": "Интеграции",
  onboarding: "Онбординг",
};

export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);
  // Не показываем на /app, /onboarding и других одиночных сегментах верхнего уровня
  if (segments.length <= 1) return null;

  return (
    <nav
      aria-label="Хлебные крошки"
      className="flex items-center gap-1.5 px-1 pb-3 text-xs"
      style={{ color: "rgba(255,255,255,0.55)" }}
    >
      <Link
        to="/app"
        className="inline-flex items-center gap-1 transition-colors hover:text-white"
      >
        <Home className="h-3 w-3" strokeWidth={1.75} />
        <span>Приложение</span>
      </Link>
      {segments.slice(1).map((seg, i) => {
        const isLast = i === segments.length - 2;
        const label = ROUTE_LABELS[seg] ?? decodeURIComponent(seg);
        return (
          <span key={i} className="flex items-center gap-1.5">
            <ChevronRight
              className="h-3 w-3 opacity-60"
              strokeWidth={1.75}
              aria-hidden
            />
            <span
              className={isLast ? "font-medium" : ""}
              style={{ color: isLast ? "#ffffff" : "rgba(255,255,255,0.55)" }}
            >
              {label}
            </span>
          </span>
        );
      })}
    </nav>
  );
}
