/**
 * AssistantMock — preview ассистент-инбокса.
 */
import {
  Inbox,
  Bot,
  MessagesSquare,
  BookOpen,
  BarChart3,
  Send,
  Globe,
  Tag,
  Phone,
  MoreHorizontal,
} from "lucide-react";

const NAV = [
  { Icon: Inbox, active: true },
  { Icon: Bot, active: false },
  { Icon: MessagesSquare, active: false },
  { Icon: BookOpen, active: false },
  { Icon: BarChart3, active: false },
];

const LEADS = [
  {
    name: "Анна К.",
    initials: "АК",
    channel: "tg" as const,
    msg: "Здравствуйте, есть двушка в Парусе до 14 млн?",
    time: "14:32",
    quality: "hot" as const,
    status: "NEW",
    active: true,
    avatarBg: "#3a4d8c",
  },
  {
    name: "Игорь М.",
    initials: "ИМ",
    channel: "web" as const,
    msg: "Сколько стоит запись на МРТ в субботу?",
    time: "13:48",
    quality: "warm" as const,
    status: "OPEN",
    active: false,
    avatarBg: "#5c4a8c",
  },
  {
    name: "+7***12",
    initials: "+7",
    channel: "avito" as const,
    msg: "Toyota Camry 2019 — есть торг?",
    time: "12:05",
    quality: "hot" as const,
    status: "OPEN",
    active: false,
    avatarBg: "#8c5e3a",
  },
  {
    name: "Мария Л.",
    initials: "МЛ",
    channel: "tg" as const,
    msg: "Когда ближайший вебинар по нутрициологии?",
    time: "11:20",
    quality: "warm" as const,
    status: "QUALIFIED",
    active: false,
    avatarBg: "#3a8c6c",
  },
  {
    name: "Дмитрий",
    initials: "ДВ",
    channel: "web" as const,
    msg: "Можно курс с рассрочкой?",
    time: "10:14",
    quality: "cold" as const,
    status: "OPEN",
    active: false,
    avatarBg: "#5e5e63",
  },
];

const CHANNEL_ICON = { tg: Send, web: Globe, avito: Tag };

const QUALITY_COLOR = {
  hot: "var(--accent)",
  warm: "#F6B547",
  cold: "var(--ink-dark-subtle)",
};

export function AssistantMock() {
  return (
    <div className="flex h-full">
      {/* Sidebar rail */}
      <div
        className="flex w-12 shrink-0 flex-col gap-1 border-r py-3 sm:w-[60px]"
        style={{ borderColor: "var(--border-dark)", background: "var(--bg-base)" }}
      >
        {NAV.map((n, i) => (
          <div key={i} className="relative flex justify-center">
            {n.active && (
              <span
                className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r"
                style={{ background: "var(--accent)" }}
              />
            )}
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[10px]"
              style={{
                background: n.active ? "rgba(197,240,74,0.12)" : "transparent",
                color: n.active ? "var(--accent)" : "var(--ink-dark-subtle)",
              }}
            >
              <n.Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </div>
          </div>
        ))}
        <div className="mt-auto flex justify-center">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full font-mono text-[11px]"
            style={{ background: "rgba(197,240,74,0.2)", color: "var(--accent)" }}
          >
            НК
          </div>
        </div>
      </div>

      {/* Lead list */}
      <div
        className="hidden w-[280px] shrink-0 flex-col border-r md:flex"
        style={{ borderColor: "var(--border-dark)", background: "var(--bg-elevated)" }}
      >
        <div
          className="flex h-12 items-center justify-between border-b px-3.5"
          style={{ borderColor: "var(--border-dark)" }}
        >
          <div className="text-[14px] font-medium" style={{ color: "var(--ink-dark)" }}>
            Inbox
          </div>
          <div
            className="rounded-full font-mono text-[11px]"
            style={{
              background: "var(--bg-soft)",
              border: "1px solid var(--border-dark)",
              color: "var(--ink-dark-muted)",
              padding: "2px 8px",
            }}
          >
            12
          </div>
        </div>

        <div className="flex h-9 items-center gap-1.5 px-3.5">
          {[
            { l: "Все", active: true },
            { l: "Hot", active: false },
            { l: "Open", active: false },
          ].map((c) => (
            <span
              key={c.l}
              className="rounded-md text-[12px]"
              style={{
                background: c.active ? "var(--bg-soft)" : "transparent",
                color: c.active ? "var(--ink-dark)" : "var(--ink-dark-muted)",
                fontWeight: c.active ? 500 : 400,
                padding: "4px 10px",
              }}
            >
              {c.l}
            </span>
          ))}
        </div>

        <div className="flex-1 overflow-hidden">
          {LEADS.map((l, i) => {
            const ChIcon = CHANNEL_ICON[l.channel];
            return (
              <div
                key={i}
                className="flex flex-col gap-1 px-3.5 py-3"
                style={{
                  borderBottom: i < LEADS.length - 1 ? "1px solid var(--border-dark)" : "none",
                  background: l.active ? "var(--bg-soft)" : "transparent",
                  borderLeft: l.active ? "2px solid var(--accent)" : "2px solid transparent",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-medium"
                      style={{ background: l.avatarBg, color: "var(--ink-dark)" }}
                    >
                      {l.initials}
                    </div>
                    <span
                      className="truncate text-[13px] font-medium"
                      style={{ color: "var(--ink-dark)" }}
                    >
                      {l.name}
                    </span>
                    <ChIcon
                      className="h-3.5 w-3.5 shrink-0"
                      strokeWidth={1.75}
                      style={{ color: "var(--ink-dark-subtle)" }}
                    />
                  </div>
                  <span
                    className="shrink-0 font-mono text-[11px]"
                    style={{ color: "var(--ink-dark-subtle)" }}
                  >
                    {l.time}
                  </span>
                </div>
                <div
                  className="truncate text-[12px]"
                  style={{ color: "var(--ink-dark-muted)" }}
                >
                  {l.msg}
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: QUALITY_COLOR[l.quality] }}
                  />
                  <span
                    className="font-mono text-[10px] uppercase"
                    style={{ color: "var(--ink-dark-subtle)" }}
                  >
                    {l.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat panel */}
      <div className="flex min-w-0 flex-1 flex-col" style={{ background: "var(--bg-elevated)" }}>
        <div
          className="flex h-14 items-center justify-between border-b px-5"
          style={{ borderColor: "var(--border-dark)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-medium"
              style={{ background: "#3a4d8c", color: "var(--ink-dark)" }}
            >
              АК
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-medium" style={{ color: "var(--ink-dark)" }}>
                Анна К.
              </span>
              <span
                className="flex items-center gap-1.5 font-mono text-[11px]"
                style={{ color: "var(--ink-dark-muted)" }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
                онлайн в Telegram
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {[Phone, MoreHorizontal, BookOpen].map((I, i) => (
              <button
                key={i}
                type="button"
                tabIndex={-1}
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ color: "var(--ink-dark-muted)" }}
              >
                <I className="h-4 w-4" strokeWidth={1.75} />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-hidden p-5">
          <Bubble side="left" text="Здравствуйте, есть двушка в Парусе до 14 млн?" time="14:32" />
          <Bubble
            side="right"
            text="Да, есть 3 варианта. Подскажите — нужен балкон и какой этаж?"
            time="14:32"
          />
          <Bubble side="left" text="Балкон да, этаж от 5-го" time="14:33" />
          <Bubble
            side="right"
            text="Подобрал две квартиры — 8 и 12 этаж. Удобно записать на показ в субботу?"
            time="14:33"
          />
          <div className="flex">
            <div
              className="flex w-[50px] items-center justify-center gap-1 rounded-[14px] py-2.5"
              style={{
                background: "var(--bg-base)",
                border: "1px solid var(--border-dark)",
              }}
            >
              {[0, 200, 400].map((d) => (
                <span
                  key={d}
                  className="h-1 w-1 rounded-full"
                  style={{
                    background: "var(--ink-dark-muted)",
                    animation: `typing-dot 1.2s ease-in-out ${d}ms infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div
          className="flex h-14 items-center gap-2.5 border-t px-5 py-3"
          style={{ borderColor: "var(--border-dark)" }}
        >
          <div
            className="flex h-9 flex-1 items-center rounded-[10px] px-3.5 text-[13px]"
            style={{
              background: "var(--bg-base)",
              border: "1px solid var(--border-dark)",
              color: "var(--ink-dark-subtle)",
            }}
          >
            Сообщение...
          </div>
          <button
            type="button"
            tabIndex={-1}
            className="flex h-9 w-9 items-center justify-center rounded-[10px]"
            style={{ background: "var(--accent)", color: "var(--bg-base)" }}
          >
            <Send className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>

        <style>{`
          @keyframes typing-dot {
            0%, 60%, 100% { opacity: 0.3; }
            30% { opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}

function Bubble({ side, text, time }: { side: "left" | "right"; text: string; time: string }) {
  const isLeft = side === "left";
  return (
    <div className={`flex flex-col ${isLeft ? "items-start" : "items-end"} gap-1`}>
      <div
        className="max-w-[75%] text-[13px]"
        style={{
          background: isLeft ? "var(--bg-base)" : "var(--accent)",
          color: isLeft ? "var(--ink-dark)" : "var(--bg-base)",
          border: isLeft ? "1px solid var(--border-dark)" : "none",
          borderRadius: isLeft ? "14px 14px 14px 4px" : "14px 14px 4px 14px",
          padding: "10px 14px",
          lineHeight: 1.4,
        }}
      >
        {text}
      </div>
      <span className="font-mono text-[10px]" style={{ color: "var(--ink-dark-subtle)" }}>
        {time}
      </span>
    </div>
  );
}
