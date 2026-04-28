import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Phone,
  PhoneOff,
  PhoneIncoming,
  Video,
  VideoOff,
  Mic,
  MicOff,
  MessageSquare,
  UserPlus,
  Check,
  X,
  Clock,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/calls")({
  component: CallsPage,
});

// ============================================================
// MOCK DATA — replace with real API
// ============================================================
type CallStatus = "incoming" | "active" | "missed" | "answered";

interface CallRecord {
  id: string;
  visitorNumber: number;
  visitorName?: string;
  city: string;
  startedAt: number; // ms epoch
  durationSec?: number; // for history/active
  status: CallStatus;
  outcome?: string;
  currentPath?: string;
  timeOnSiteSec?: number;
  chatHistory?: { role: "visitor" | "ai" | "operator"; text: string }[];
}

const MOCK_INCOMING: CallRecord = {
  id: "in-1",
  visitorNumber: 7,
  city: "Москва",
  startedAt: Date.now() - 12_000,
  status: "incoming",
  currentPath: "/pricing",
  timeOnSiteSec: 180,
  chatHistory: [
    { role: "visitor", text: "Здравствуйте, можно узнать про тариф Business?" },
    { role: "ai", text: "Конечно! Тариф Business стоит 2 490 ₽/мес и включает..." },
    { role: "visitor", text: "А можно поговорить с менеджером?" },
  ],
};

const MOCK_HISTORY: CallRecord[] = [
  {
    id: "h-1",
    visitorNumber: 42,
    visitorName: "Анна К.",
    city: "Санкт-Петербург",
    startedAt: Date.now() - 1000 * 60 * 60 * 2,
    durationSec: 263,
    status: "answered",
    outcome: "Лид создан",
  },
  {
    id: "h-2",
    visitorNumber: 38,
    city: "Казань",
    startedAt: Date.now() - 1000 * 60 * 60 * 5,
    durationSec: 0,
    status: "missed",
    outcome: "—",
  },
  {
    id: "h-3",
    visitorNumber: 31,
    visitorName: "Дмитрий П.",
    city: "Москва",
    startedAt: Date.now() - 1000 * 60 * 60 * 26,
    durationSec: 412,
    status: "answered",
    outcome: "Лид создан",
  },
  {
    id: "h-4",
    visitorNumber: 27,
    city: "Новосибирск",
    startedAt: Date.now() - 1000 * 60 * 60 * 48,
    durationSec: 95,
    status: "answered",
    outcome: "—",
  },
  {
    id: "h-5",
    visitorNumber: 19,
    city: "Екатеринбург",
    startedAt: Date.now() - 1000 * 60 * 60 * 72,
    durationSec: 0,
    status: "missed",
    outcome: "—",
  },
];

// ============================================================
// HELPERS
// ============================================================
function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatRelative(ts: number) {
  const diff = Date.now() - ts;
  const h = Math.floor(diff / (1000 * 60 * 60));
  if (h < 1) return "только что";
  if (h < 24) return `${h} ч назад`;
  return `${Math.floor(h / 24)} дн назад`;
}

function avatarColor(n: number) {
  const colors = [
    "bg-rose-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-sky-500",
    "bg-violet-500",
    "bg-pink-500",
  ];
  return colors[n % colors.length];
}

// ============================================================
// PAGE
// ============================================================
type Tab = "incoming" | "active" | "history";

function CallsPage() {
  const [tab, setTab] = useState<Tab>("incoming");
  const [incomingCall, setIncomingCall] = useState<CallRecord | null>(MOCK_INCOMING);
  const [activeCall, setActiveCall] = useState<CallRecord | null>(null);
  const [history, setHistory] = useState<CallRecord[]>(MOCK_HISTORY);

  // tick for counters
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const incomingElapsed = incomingCall
    ? Math.floor((Date.now() - incomingCall.startedAt) / 1000)
    : 0;
  const activeElapsed = activeCall
    ? Math.floor((Date.now() - activeCall.startedAt) / 1000)
    : 0;

  // TODO: replace with real WebRTC accept
  const acceptCall = () => {
    if (!incomingCall) return;
    const accepted: CallRecord = {
      ...incomingCall,
      status: "active",
      startedAt: Date.now(),
    };
    setActiveCall(accepted);
    setIncomingCall(null);
    setTab("active");
  };

  const declineCall = () => {
    if (!incomingCall) return;
    setHistory((prev) => [
      { ...incomingCall, status: "missed", durationSec: 0, outcome: "—" },
      ...prev,
    ]);
    setIncomingCall(null);
  };

  const endCall = () => {
    if (!activeCall) return;
    setHistory((prev) => [
      {
        ...activeCall,
        status: "answered",
        durationSec: activeElapsed,
        outcome: "—",
      },
      ...prev,
    ]);
    setActiveCall(null);
    setTab("history");
  };

  const incomingCount = incomingCall ? 1 : 0;
  const activeCount = activeCall ? 1 : 0;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-background">
      {/* LEFT PANEL */}
      <aside className="w-[320px] border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-semibold">Звонки</h1>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <TabButton
            active={tab === "incoming"}
            onClick={() => setTab("incoming")}
            label="Входящие"
            badge={incomingCount > 0 ? incomingCount : undefined}
            badgeVariant="red"
          />
          <TabButton
            active={tab === "active"}
            onClick={() => setTab("active")}
            label="Активные"
            badge={activeCount > 0 ? activeCount : undefined}
            badgeVariant="green"
          />
          <TabButton
            active={tab === "history"}
            onClick={() => setTab("history")}
            label="История"
          />
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {tab === "incoming" && (
            <>
              {incomingCall ? (
                <IncomingCallCard
                  call={incomingCall}
                  elapsed={incomingElapsed}
                  onAccept={acceptCall}
                  onDecline={declineCall}
                />
              ) : (
                <EmptyText text="Нет входящих звонков" />
              )}
            </>
          )}

          {tab === "active" && (
            <>
              {activeCall ? (
                <ActiveCallCard
                  call={activeCall}
                  elapsed={activeElapsed}
                  onEnd={endCall}
                />
              ) : (
                <EmptyText text="Нет активных звонков" />
              )}
            </>
          )}

          {tab === "history" && (
            <>
              {history.length === 0 ? (
                <EmptyText text="История пуста" />
              ) : (
                history.map((c) => <HistoryRow key={c.id} call={c} />)
              )}
            </>
          )}
        </div>
      </aside>

      {/* RIGHT PANEL */}
      <main className="flex-1 overflow-hidden">
        {activeCall ? (
          <ActiveCallView call={activeCall} elapsed={activeElapsed} onEnd={endCall} />
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  );
}

// ============================================================
// LEFT PANEL — components
// ============================================================
function TabButton({
  active,
  onClick,
  label,
  badge,
  badgeVariant = "red",
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  badge?: number;
  badgeVariant?: "red" | "green";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 px-2 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5",
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      {badge !== undefined && (
        <span
          className={cn(
            "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold text-white",
            badgeVariant === "red" ? "bg-red-500" : "bg-emerald-500"
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function EmptyText({ text }: { text: string }) {
  return (
    <div className="text-center text-sm text-muted-foreground py-12">{text}</div>
  );
}

function IncomingCallCard({
  call,
  elapsed,
  onAccept,
  onDecline,
}: {
  call: CallRecord;
  elapsed: number;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="rounded-xl border-2 border-red-500 p-4 bg-red-500/5 animate-pulse-border">
      <style>{`
        @keyframes pulseBorder {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
          50% { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
        }
        .animate-pulse-border { animation: pulseBorder 1.5s ease-in-out infinite; }
      `}</style>

      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm",
            avatarColor(call.visitorNumber)
          )}
        >
          #{call.visitorNumber}
        </div>
        <div className="min-w-0">
          <div className="font-medium text-sm">
            {call.visitorName ?? `Посетитель #${call.visitorNumber}`}
          </div>
          <div className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 font-medium">
            <PhoneIncoming className="w-3 h-3" />
            Входящий звонок · {formatDuration(elapsed)}
          </div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground mb-3 space-y-1">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3" />
          Сейчас на: <span className="font-mono text-foreground">{call.currentPath}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          {Math.floor((call.timeOnSiteSec ?? 0) / 60)} мин на сайте
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={onAccept}
          size="sm"
          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          <Check className="w-4 h-4 mr-1" /> Принять
        </Button>
        <Button
          onClick={onDecline}
          size="sm"
          variant="destructive"
          className="flex-1"
        >
          <X className="w-4 h-4 mr-1" /> Отклонить
        </Button>
      </div>
    </div>
  );
}

function ActiveCallCard({
  call,
  elapsed,
  onEnd,
}: {
  call: CallRecord;
  elapsed: number;
  onEnd: () => void;
}) {
  return (
    <div className="rounded-xl border-2 border-emerald-500 p-4 bg-emerald-500/5">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm",
            avatarColor(call.visitorNumber)
          )}
        >
          #{call.visitorNumber}
        </div>
        <div className="min-w-0">
          <div className="font-medium text-sm">
            {call.visitorName ?? `Посетитель #${call.visitorNumber}`}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-medium">
            {formatDuration(elapsed)}
          </div>
        </div>
      </div>
      <div className="text-xs text-muted-foreground mb-3">{call.city}</div>
      <Button onClick={onEnd} size="sm" variant="destructive" className="w-full">
        <PhoneOff className="w-4 h-4 mr-1" /> Завершить
      </Button>
    </div>
  );
}

function HistoryRow({ call }: { call: CallRecord }) {
  const isMissed = call.status === "missed";
  return (
    <div className="rounded-lg border border-border p-3 hover:bg-muted/40 transition-colors cursor-pointer">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0",
            avatarColor(call.visitorNumber)
          )}
        >
          #{call.visitorNumber}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="font-medium text-sm truncate">
              {call.visitorName ?? `Посетитель #${call.visitorNumber}`}
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {formatRelative(call.startedAt)}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] h-5 px-1.5",
                isMissed
                  ? "text-red-600 border-red-500/40 bg-red-500/10"
                  : "text-emerald-600 border-emerald-500/40 bg-emerald-500/10"
              )}
            >
              {isMissed ? "Пропущен" : "Принят"}
            </Badge>
            {!isMissed && (
              <span className="text-xs text-muted-foreground font-mono">
                {formatDuration(call.durationSec ?? 0)}
              </span>
            )}
            <span className="text-xs text-muted-foreground">· {call.outcome}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================
function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-8 text-center">
      <div className="w-32 h-32 rounded-full bg-muted/50 flex items-center justify-center mb-6">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground"
        >
          <path d="m23 7-7 5 7 5V7z" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold mb-2">Нет активных звонков</h2>
      <p className="text-sm text-muted-foreground max-w-sm">
        Запросы на видеозвонок появятся здесь автоматически
      </p>
    </div>
  );
}

// ============================================================
// ACTIVE CALL VIEW (right panel)
// ============================================================
function ActiveCallView({
  call,
  elapsed,
  onEnd,
}: {
  call: CallRecord;
  elapsed: number;
  onEnd: () => void;
}) {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [lead, setLead] = useState({ name: "", phone: "", email: "", notes: "" });

  const timeOnSite = useMemo(() => {
    const sec = (call.timeOnSiteSec ?? 0) + elapsed;
    return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")} мин на сайте`;
  }, [call.timeOnSiteSec, elapsed]);

  return (
    <div className="h-full flex flex-col">
      {/* Top strip */}
      <div className="px-4 py-2.5 border-b border-border bg-card flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs",
              avatarColor(call.visitorNumber)
            )}
          >
            #{call.visitorNumber}
          </div>
          <span className="font-medium">Посетитель #{call.visitorNumber}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{call.city}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{timeOnSite}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono font-medium">{formatDuration(elapsed)}</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Video area */}
        <div className="flex-1 bg-neutral-900 relative flex items-center justify-center">
          {/* Main video placeholder */}
          <div className="flex flex-col items-center gap-3">
            <div
              className={cn(
                "w-32 h-32 rounded-full flex items-center justify-center text-white font-bold text-2xl",
                avatarColor(call.visitorNumber)
              )}
            >
              #{call.visitorNumber}
            </div>
            <div className="text-neutral-400 text-sm flex items-center gap-2">
              <VideoOff className="w-4 h-4" /> Камера выключена
            </div>
          </div>

          {/* Self preview PiP */}
          <div className="absolute bottom-4 right-4 w-44 h-32 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden shadow-xl">
            {camOn ? (
              <div className="text-neutral-500 text-xs">[ваше видео]</div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-neutral-500">
                <VideoOff className="w-5 h-5" />
                <span className="text-[10px]">Вы</span>
              </div>
            )}
          </div>

          {/* Bottom control bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-neutral-800/90 backdrop-blur rounded-full px-3 py-2 shadow-2xl border border-neutral-700">
            <ControlButton
              active={micOn}
              onClick={() => setMicOn((v) => !v)}
              icon={micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              label="Микрофон"
            />
            <ControlButton
              active={camOn}
              onClick={() => setCamOn((v) => !v)}
              icon={camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              label="Камера"
            />
            <ControlButton
              active={chatOpen}
              onClick={() => setChatOpen((v) => !v)}
              icon={<MessageSquare className="w-4 h-4" />}
              label="Чат"
            />
            <ControlButton
              active={showLeadForm}
              onClick={() => setShowLeadForm((v) => !v)}
              icon={<UserPlus className="w-4 h-4" />}
              label="Лид"
            />
            <button
              onClick={onEnd}
              className="ml-1 inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
              title="Завершить"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Context sidebar */}
        <aside className="w-[240px] border-l border-border bg-card overflow-y-auto p-4 space-y-5">
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Текущая страница
            </h3>
            <div className="text-sm font-mono bg-muted px-2 py-1.5 rounded">
              {call.currentPath ?? "/"}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              История чата
            </h3>
            <div className="space-y-2">
              {(call.chatHistory ?? []).slice(-3).map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "text-xs p-2 rounded-lg",
                    m.role === "visitor"
                      ? "bg-muted"
                      : m.role === "ai"
                        ? "bg-primary/10"
                        : "bg-emerald-500/10"
                  )}
                >
                  <div className="text-[10px] font-semibold uppercase text-muted-foreground mb-0.5">
                    {m.role === "visitor" ? "Гость" : m.role === "ai" ? "AI" : "Оператор"}
                  </div>
                  <div className="line-clamp-3">{m.text}</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Быстрый лид
            </h3>
            <div className="space-y-2">
              <div>
                <Label htmlFor="ld-name" className="text-xs">Имя</Label>
                <Input
                  id="ld-name"
                  value={lead.name}
                  onChange={(e) => setLead({ ...lead, name: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="ld-phone" className="text-xs">Телефон</Label>
                <Input
                  id="ld-phone"
                  value={lead.phone}
                  onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="ld-email" className="text-xs">Email</Label>
                <Input
                  id="ld-email"
                  value={lead.email}
                  onChange={(e) => setLead({ ...lead, email: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="ld-notes" className="text-xs">Заметки</Label>
                <Textarea
                  id="ld-notes"
                  value={lead.notes}
                  onChange={(e) => setLead({ ...lead, notes: e.target.value })}
                  className="text-sm min-h-[60px]"
                />
              </div>
              <Button size="sm" className="w-full">
                Сохранить лид
              </Button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ControlButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors",
        active
          ? "bg-neutral-700 text-white hover:bg-neutral-600"
          : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
      )}
    >
      {icon}
    </button>
  );
}
