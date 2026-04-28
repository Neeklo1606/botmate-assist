/**
 * /app/visitors — real-time visitor tracking dashboard.
 *
 * Live ops center: top bar with live counter, filterable visitor cards,
 * slide-in detail panel with page-path timeline.
 *
 * All data is mocked. // TODO: replace with real API
 */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  MessageCircle,
  Video,
  UserPlus,
  X,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Clock,
  ChevronDown,
  ChevronUp,
  Users as UsersIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/visitors")({
  component: VisitorsPage,
});

// ===== Types & mocks ========================================================

type Status = "active" | "recent" | "inactive";
type DeviceType = "mobile" | "desktop" | "tablet";

interface PageHit {
  title: string;
  url: string;
  seconds: number;
}

interface ChatMsg {
  who: "visitor" | "assistant";
  text: string;
  at: string;
}

interface Visitor {
  id: string;
  number: number;
  status: Status;
  timeOnSiteSec: number;
  currentUrl: string;
  path: PageHit[]; // last item = current
  device: { type: DeviceType; label: string };
  browser: string;
  os: string;
  screen: string;
  city: string;
  country: string;
  flag: string;
  utm: { source?: string; medium?: string; campaign?: string; term?: string };
  tags: string[];
  firstVisit: string;
  totalVisits: number;
  totalTimeSec: number;
  chat: ChatMsg[];
}

// Color palette for avatars
const AVATAR_COLORS = ["#a8ff57", "#57c7ff", "#ff9f57", "#d57aff", "#ff6b9d", "#5eead4"];

// TODO: replace with real API
const MOCK_VISITORS: Visitor[] = [
  {
    id: "v1", number: 1, status: "active", timeOnSiteSec: 154,
    currentUrl: "/pricing", path: [
      { title: "Главная", url: "/", seconds: 23 },
      { title: "Услуги", url: "/services", seconds: 45 },
      { title: "Цены", url: "/pricing", seconds: 86 },
    ],
    device: { type: "mobile", label: "iPhone 14" },
    browser: "Safari 17", os: "iOS 17.2", screen: "390 × 844",
    city: "Москва", country: "Россия", flag: "🇷🇺",
    utm: { source: "Яндекс.Директ", medium: "cpc", campaign: "kitchens-2026", term: "кухни 2026" },
    tags: ["новый посетитель", "смотрит цены", "высокая активность"],
    firstVisit: "5 мин назад", totalVisits: 1, totalTimeSec: 154,
    chat: [],
  },
  {
    id: "v2", number: 2, status: "active", timeOnSiteSec: 412,
    currentUrl: "/cases/kuhni-msk", path: [
      { title: "Цены", url: "/pricing", seconds: 31 },
      { title: "Кейсы", url: "/cases", seconds: 80 },
      { title: "Кейс Москва", url: "/cases/kuhni-msk", seconds: 301 },
    ],
    device: { type: "desktop", label: "MacBook Pro" },
    browser: "Chrome 121", os: "macOS 14.3", screen: "2560 × 1600",
    city: "Санкт-Петербург", country: "Россия", flag: "🇷🇺",
    utm: { source: "google", medium: "organic" },
    tags: ["возвращается", "читает кейс"],
    firstVisit: "вчера", totalVisits: 4, totalTimeSec: 1840,
    chat: [
      { who: "visitor", text: "Сколько стоит кухня 12 м²?", at: "2 мин назад" },
      { who: "assistant", text: "От 280 000 ₽ под ключ. Хотите расчёт под ваш проект?", at: "2 мин назад" },
    ],
  },
  {
    id: "v3", number: 3, status: "active", timeOnSiteSec: 38,
    currentUrl: "/", path: [
      { title: "Главная", url: "/", seconds: 38 },
    ],
    device: { type: "mobile", label: "Samsung Galaxy S23" },
    browser: "Chrome Mobile", os: "Android 14", screen: "360 × 780",
    city: "Казань", country: "Россия", flag: "🇷🇺",
    utm: { source: "vk.com", medium: "social", campaign: "spring-promo" },
    tags: ["новый посетитель"],
    firstVisit: "1 мин назад", totalVisits: 1, totalTimeSec: 38,
    chat: [],
  },
  {
    id: "v4", number: 4, status: "recent", timeOnSiteSec: 689,
    currentUrl: "/contacts", path: [
      { title: "Главная", url: "/", seconds: 14 },
      { title: "О нас", url: "/about", seconds: 92 },
      { title: "Услуги", url: "/services", seconds: 220 },
      { title: "Контакты", url: "/contacts", seconds: 363 },
    ],
    device: { type: "desktop", label: "Windows PC" },
    browser: "Edge 121", os: "Windows 11", screen: "1920 × 1080",
    city: "Екатеринбург", country: "Россия", flag: "🇷🇺",
    utm: { source: "yandex", medium: "organic" },
    tags: ["готов к контакту"],
    firstVisit: "3 дня назад", totalVisits: 7, totalTimeSec: 4200,
    chat: [
      { who: "visitor", text: "Можно приехать в офис посмотреть?", at: "8 мин назад" },
      { who: "assistant", text: "Конечно! Адрес: Ленина 1. Удобно во вторник в 14:00?", at: "7 мин назад" },
    ],
  },
  {
    id: "v5", number: 5, status: "active", timeOnSiteSec: 76,
    currentUrl: "/faq", path: [
      { title: "Главная", url: "/", seconds: 18 },
      { title: "FAQ", url: "/faq", seconds: 58 },
    ],
    device: { type: "tablet", label: "iPad Air" },
    browser: "Safari 17", os: "iPadOS 17", screen: "1180 × 820",
    city: "Новосибирск", country: "Россия", flag: "🇷🇺",
    utm: { source: "direct" },
    tags: ["новый посетитель"],
    firstVisit: "2 мин назад", totalVisits: 1, totalTimeSec: 76,
    chat: [],
  },
  {
    id: "v6", number: 6, status: "recent", timeOnSiteSec: 220,
    currentUrl: "/pricing", path: [
      { title: "Главная", url: "/", seconds: 20 },
      { title: "Цены", url: "/pricing", seconds: 200 },
    ],
    device: { type: "mobile", label: "iPhone 13" },
    browser: "Safari", os: "iOS 16.6", screen: "390 × 844",
    city: "Минск", country: "Беларусь", flag: "🇧🇾",
    utm: { source: "Instagram", medium: "social" },
    tags: ["смотрит цены"],
    firstVisit: "10 мин назад", totalVisits: 2, totalTimeSec: 540,
    chat: [],
  },
  {
    id: "v7", number: 7, status: "inactive", timeOnSiteSec: 95,
    currentUrl: "/about", path: [
      { title: "Главная", url: "/", seconds: 30 },
      { title: "О нас", url: "/about", seconds: 65 },
    ],
    device: { type: "desktop", label: "Linux PC" },
    browser: "Firefox 122", os: "Ubuntu 22.04", screen: "1366 × 768",
    city: "Алматы", country: "Казахстан", flag: "🇰🇿",
    utm: { source: "google", medium: "organic" },
    tags: ["неактивен"],
    firstVisit: "20 мин назад", totalVisits: 1, totalTimeSec: 95,
    chat: [],
  },
];

// ===== Helpers ==============================================================

const fmtTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
};

const fmtTotal = (s: number) => {
  if (s < 60) return `${s} сек`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  return `${h} ч ${m % 60} мин`;
};

const STATUS_BORDER: Record<Status, string> = {
  active: "border-l-[#a8ff57]",
  recent: "border-l-[#facc15]",
  inactive: "border-l-[#3f3f3f]",
};

const STATUS_DOT: Record<Status, string> = {
  active: "bg-[#a8ff57]",
  recent: "bg-[#facc15]",
  inactive: "bg-[#666]",
};

const DeviceIcon = ({ type }: { type: DeviceType }) => {
  if (type === "mobile") return <Smartphone className="h-3.5 w-3.5" />;
  if (type === "tablet") return <Tablet className="h-3.5 w-3.5" />;
  return <Monitor className="h-3.5 w-3.5" />;
};

// ===== Page =================================================================

type FilterKind = "all" | "active" | "with-chat" | "without-chat";
type Range = "today" | "7d" | "30d";

function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>(MOCK_VISITORS);
  const [filter, setFilter] = useState<FilterKind>("all");
  const [range, setRange] = useState<Range>("today");
  const [openId, setOpenId] = useState<string | null>(null);

  // Animate "time on site" for active visitors
  useEffect(() => {
    const id = setInterval(() => {
      setVisitors((prev) => prev.map((v) => v.status === "active" ? { ...v, timeOnSiteSec: v.timeOnSiteSec + 1 } : v));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    return visitors.filter((v) => {
      if (filter === "active" && v.status !== "active") return false;
      if (filter === "with-chat" && v.chat.length === 0) return false;
      if (filter === "without-chat" && v.chat.length > 0) return false;
      return true;
    });
  }, [visitors, filter]);

  const liveCount = visitors.filter((v) => v.status === "active").length;
  const openVisitor = visitors.find((v) => v.id === openId) ?? null;

  return (
    <div className="min-h-full bg-[#141414] text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-[#2a2a2a] bg-[#141414]/95 backdrop-blur">
        <div className="px-6 py-5 flex flex-wrap items-center gap-4">
          <h1 className="text-2xl font-semibold">Посетители</h1>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#a8ff57]/10 border border-[#a8ff57]/30">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#a8ff57] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#a8ff57]" />
            </span>
            <span className="text-sm text-[#a8ff57] font-medium">
              {liveCount} {pluralize(liveCount, "человек", "человека", "человек")} сейчас на сайте
            </span>
          </div>

          <div className="flex-1" />

          {/* Filter pills */}
          <div className="inline-flex rounded-md border border-[#2a2a2a] bg-[#1a1a1a] p-1">
            {([
              ["all", "Все"],
              ["active", "Активные"],
              ["with-chat", "С чатом"],
              ["without-chat", "Без чата"],
            ] as Array<[FilterKind, string]>).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded transition-colors",
                  filter === k ? "bg-[#2a2a2a] text-white" : "text-white/60 hover:text-white"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Time range */}
          <div className="inline-flex rounded-md border border-[#2a2a2a] bg-[#1a1a1a] p-1">
            {([
              ["today", "Сегодня"],
              ["7d", "7 дней"],
              ["30d", "30 дней"],
            ] as Array<[Range, string]>).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setRange(k)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded transition-colors",
                  range === k ? "bg-[#2a2a2a] text-white" : "text-white/60 hover:text-white"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="p-6 space-y-3">
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          filtered.map((v) => (
            <VisitorCard
              key={v.id}
              visitor={v}
              onOpen={() => setOpenId(v.id)}
            />
          ))
        )}
      </div>

      {openVisitor && (
        <DetailPanel visitor={openVisitor} onClose={() => setOpenId(null)} />
      )}
    </div>
  );
}

// ===== Visitor card =========================================================

function VisitorCard({ visitor, onOpen }: { visitor: Visitor; onOpen: () => void }) {
  const color = AVATAR_COLORS[(visitor.number - 1) % AVATAR_COLORS.length];
  const isActive = visitor.status === "active";
  const utmShort = [
    visitor.utm.source,
    visitor.utm.term ? `"${visitor.utm.term}"` : null,
  ].filter(Boolean).join(" / ");

  return (
    <div
      onClick={onOpen}
      className={cn(
        "group relative flex items-center gap-4 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4 pl-5 cursor-pointer",
        "border-l-4 transition-all hover:bg-[#1f1f1f] hover:border-[#3a3a3a]",
        STATUS_BORDER[visitor.status],
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className="h-12 w-12 rounded-full flex items-center justify-center font-semibold text-black"
          style={{ background: color }}
        >
          {visitor.number}
        </div>
        <span className={cn(
          "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-[#1a1a1a]",
          STATUS_DOT[visitor.status],
          isActive && "animate-pulse"
        )} />
      </div>

      {/* Center */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-white truncate">{visitor.currentUrl}</span>
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#0f0f0f] border border-[#2a2a2a] text-white/70">
            <Clock className="h-3 w-3" />
            {fmtTime(visitor.timeOnSiteSec)}
          </span>
        </div>

        <div className="text-xs text-white/50 truncate">
          {visitor.path.map((p, i) => (
            <span key={i}>
              {i > 0 && <span className="text-white/30 mx-1">→</span>}
              <span className={i === visitor.path.length - 1 ? "text-white/70" : ""}>{p.title}</span>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-white/60 flex-wrap">
          <span className="inline-flex items-center gap-1"><DeviceIcon type={visitor.device.type} /> {visitor.device.label}</span>
          <span className="text-white/20">·</span>
          <span>{visitor.flag} {visitor.city}</span>
          {utmShort && (
            <>
              <span className="text-white/20">·</span>
              <span className="truncate">{utmShort}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {visitor.tags.map((t) => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-[#0f0f0f] border border-[#2a2a2a] text-white/70">
              {t}
            </span>
          ))}
          {visitor.chat.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#a8ff57]/10 border border-[#a8ff57]/30 text-[#a8ff57] inline-flex items-center gap-1">
              <MessageCircle className="h-2.5 w-2.5" /> {visitor.chat.length}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className={cn(
        "flex items-center gap-2 transition-opacity shrink-0",
        isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}>
        <Button
          size="sm"
          onClick={(e) => { e.stopPropagation(); toast.success("Чат открыт"); }}
          className="bg-[#a8ff57] text-black hover:bg-[#a8ff57]/90"
        >
          <MessageCircle className="h-4 w-4 mr-1" /> Написать
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => { e.stopPropagation(); toast.success("Звоним…"); }}
          className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#2a2a2a]"
        >
          <Video className="h-4 w-4 mr-1" /> Позвонить
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => { e.stopPropagation(); toast("Назначено менеджеру"); }}
          className="text-white/70 hover:bg-[#2a2a2a]"
        >
          <UserPlus className="h-4 w-4 mr-1" /> Назначить
        </Button>
      </div>
    </div>
  );
}

// ===== Detail slide-in ======================================================

function DetailPanel({ visitor, onClose }: { visitor: Visitor; onClose: () => void }) {
  const [chatOpen, setChatOpen] = useState(false);
  const color = AVATAR_COLORS[(visitor.number - 1) % AVATAR_COLORS.length];
  const totalPathSec = visitor.path.reduce((a, b) => a + b.seconds, 0) || 1;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-[480px] bg-[#0f0f0f] border-l border-[#2a2a2a] shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="p-5 border-b border-[#2a2a2a] flex items-start gap-4">
          <div className="relative shrink-0">
            <div
              className="h-14 w-14 rounded-full flex items-center justify-center font-semibold text-black text-lg"
              style={{ background: color }}
            >
              {visitor.number}
            </div>
            <span className={cn(
              "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-[#0f0f0f]",
              STATUS_DOT[visitor.status],
              visitor.status === "active" && "animate-pulse"
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-white/40 uppercase tracking-wider">Anonymous · #{visitor.id}</div>
            <div className="text-lg font-semibold mt-0.5">Посетитель {visitor.number}</div>
            <div className="text-xs text-white/50 mt-0.5">{visitor.flag} {visitor.city}, {visitor.country}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-[#2a2a2a] text-white/60">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Profile */}
          <Section title="Профиль">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Stat label="Первый визит" value={visitor.firstVisit} />
              <Stat label="Всего визитов" value={String(visitor.totalVisits)} />
              <Stat label="Время сейчас" value={fmtTime(visitor.timeOnSiteSec)} />
              <Stat label="Всего времени" value={fmtTotal(visitor.totalTimeSec)} />
            </div>
          </Section>

          <Section title="Устройство">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Stat label="Девайс" value={visitor.device.label} icon={<DeviceIcon type={visitor.device.type} />} />
              <Stat label="Браузер" value={visitor.browser} />
              <Stat label="OS" value={visitor.os} />
              <Stat label="Экран" value={visitor.screen} />
            </div>
          </Section>

          <Section title="Гео">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Stat label="Город" value={visitor.city} />
              <Stat label="Страна" value={`${visitor.flag} ${visitor.country}`} icon={<Globe className="h-3.5 w-3.5" />} />
            </div>
          </Section>

          <Section title="UTM">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Stat label="source" value={visitor.utm.source ?? "—"} mono />
              <Stat label="medium" value={visitor.utm.medium ?? "—"} mono />
              <Stat label="campaign" value={visitor.utm.campaign ?? "—"} mono />
              <Stat label="term" value={visitor.utm.term ?? "—"} mono />
            </div>
          </Section>

          {/* Page path timeline */}
          <Section title="Путь по сайту">
            <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
              {visitor.path.map((p, i) => {
                const isCurrent = i === visitor.path.length - 1;
                const widthPct = (p.seconds / totalPathSec) * 100;
                return (
                  <div key={i} className="flex flex-col gap-1.5 min-w-[110px]">
                    <div className={cn(
                      "rounded-md border px-3 py-2 text-xs",
                      isCurrent
                        ? "bg-[#a8ff57]/10 border-[#a8ff57]/40 text-white"
                        : "bg-[#1a1a1a] border-[#2a2a2a] text-white/80"
                    )}>
                      <div className="font-medium truncate">{p.title}</div>
                      <div className="text-[10px] text-white/50 mt-0.5">
                        {fmtTime(p.seconds)} {isCurrent && "← сейчас"}
                      </div>
                    </div>
                    <div className="h-1.5 rounded bg-[#1a1a1a] overflow-hidden">
                      <div
                        className={cn("h-full", isCurrent ? "bg-[#a8ff57]" : "bg-white/30")}
                        style={{ width: `${Math.max(8, widthPct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Tags */}
          <Section title="Теги">
            <div className="flex flex-wrap gap-1.5">
              {visitor.tags.map((t) => (
                <span key={t} className="text-xs px-2 py-1 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] text-white/80">
                  {t}
                </span>
              ))}
            </div>
          </Section>

          {/* Chat */}
          {visitor.chat.length > 0 && (
            <Section title={`Диалог (${visitor.chat.length})`}>
              <button
                onClick={() => setChatOpen((v) => !v)}
                className="w-full flex items-center justify-between text-sm text-white/70 hover:text-white"
              >
                <span>{chatOpen ? "Свернуть" : "Развернуть"}</span>
                {chatOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {chatOpen && (
                <div className="mt-3 space-y-2">
                  {visitor.chat.map((m, i) => (
                    <div
                      key={i}
                      className={cn(
                        "rounded-md p-2.5 text-sm",
                        m.who === "visitor"
                          ? "bg-[#1a1a1a] border border-[#2a2a2a]"
                          : "bg-[#a8ff57]/10 border border-[#a8ff57]/20 ml-6"
                      )}
                    >
                      <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">
                        {m.who === "visitor" ? "Посетитель" : "Ассистент"} · {m.at}
                      </div>
                      <div className="text-white/90">{m.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-[#2a2a2a] grid grid-cols-3 gap-2">
          <Button
            onClick={() => toast.success("Чат открыт")}
            className="bg-[#a8ff57] text-black hover:bg-[#a8ff57]/90"
          >
            <MessageCircle className="h-4 w-4 mr-1" /> Чат
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.success("Звоним…")}
            className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#2a2a2a]"
          >
            <Video className="h-4 w-4 mr-1" /> Позвонить
          </Button>
          <Button
            variant="ghost"
            onClick={() => toast("Тег добавлен")}
            className="text-white/80 hover:bg-[#2a2a2a]"
          >
            <UserPlus className="h-4 w-4 mr-1" /> Тег
          </Button>
        </div>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4 border-b border-[#2a2a2a]">
      <div className="text-xs uppercase tracking-wider text-white/40 mb-3">{title}</div>
      {children}
    </div>
  );
}

function Stat({ label, value, icon, mono }: { label: string; value: string; icon?: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
      <div className={cn("text-white/90 mt-0.5 inline-flex items-center gap-1.5", mono && "font-mono text-xs")}>
        {icon}{value}
      </div>
    </div>
  );
}

// ===== Empty state ==========================================================

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-[#2a2a2a] bg-[#1a1a1a]/50 py-16 px-6 text-center">
      <div className="mx-auto h-14 w-14 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center mb-4">
        <UsersIcon className="h-6 w-6 text-white/40" />
      </div>
      <div className="text-lg font-medium text-white">Никого нет на сайте прямо сейчас</div>
      <div className="text-sm text-white/50 mt-1 max-w-sm mx-auto">
        Установите виджет на ваш сайт, чтобы видеть посетителей в реальном времени.
      </div>
      <Button className="mt-5 bg-[#a8ff57] text-black hover:bg-[#a8ff57]/90">
        Установить виджет
      </Button>
    </div>
  );
}

// ===== Misc =================================================================

function pluralize(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
