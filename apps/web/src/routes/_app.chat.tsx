/**
 * /app/chat — operator chat interface (3-panel).
 *
 *  [ Sessions 280px ] [ Messages flex-1 ] [ Visitor context 280px ]
 *
 * Данные из API (`/api/v1/chat/*`) при реальной авторизации.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import {
  Search,
  Send,
  ArrowRightLeft,
  XCircle,
  Smartphone,
  Monitor,
  Tablet,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ChatMessageDto, ChatSessionSummaryDto, PatchChatSessionBody } from "@botmate/shared";
import { fetchCurrentUser } from "@/lib/auth";
import { apiClient } from "@/lib/api/client";
import { qk } from "@/lib/query-keys";
import type { User } from "@/types/entities";
import { ProductApiGate } from "@/components/app/product-api-gate";
import { FeatureEmptyState } from "@/components/app/feature-empty-state";

export const Route = createFileRoute("/_app/chat")({
  head: () => ({
    meta: [{ title: "Чат — botme" }],
  }),
  component: ChatPage,
});

// ===== Types & mocks ========================================================

type SessionStatus = "ai" | "operator" | "closed";
type DeviceType = "mobile" | "desktop" | "tablet";

interface Message {
  id: string;
  who: "visitor" | "ai" | "operator" | "system";
  text: string;
  at: string;
  authorName?: string;
}

interface PageHit { title: string; seconds: number; }

interface Session {
  id: string;
  number: number;
  visitorName?: string;
  status: SessionStatus;
  unread: number;
  device: { type: DeviceType; label: string };
  city: string;
  flag: string;
  source: string;
  firstSeen: string;
  sessionStartedAt: string;
  path: PageHit[];
  messages: Message[];
}

const AVATAR_COLORS = ["#a8ff57", "#57c7ff", "#ff9f57", "#d57aff", "#ff6b9d", "#5eead4"];

const STATUS_META: Record<SessionStatus, { label: string; dot: string; bar: string }> = {
  ai:       { label: "Ассистент", dot: "bg-[#a8ff57]", bar: "bg-[#a8ff57]" },
  operator: { label: "Оператор",  dot: "bg-[#57c7ff]", bar: "bg-[#57c7ff]" },
  closed:   { label: "Завершён",  dot: "bg-[#666]",    bar: "bg-[#666]" },
};


// ===== Helpers ==============================================================

const DeviceIcon = ({ type }: { type: DeviceType }) => {
  if (type === "mobile") return <Smartphone className="h-3.5 w-3.5" />;
  if (type === "tablet") return <Tablet className="h-3.5 w-3.5" />;
  return <Monitor className="h-3.5 w-3.5" />;
};

const fmtDur = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;


function fmtChatClock(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function fmtChatDay(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return "сегодня";
    return d.toLocaleDateString("ru-RU");
  } catch {
    return iso;
  }
}

function dtoToUiMessage(dto: ChatMessageDto): Message {
  return {
    id: dto.id,
    who: dto.bubbleWho,
    text: dto.content,
    at: fmtChatClock(dto.createdAt),
    authorName: dto.authorName,
  };
}

function dtoToUiSession(summary: ChatSessionSummaryDto, messages: Message[]): Session {
  return {
    id: summary.id,
    number: summary.displayNumber,
    visitorName: summary.visitorName ?? undefined,
    status: summary.lane,
    unread: summary.unread,
    device: {
      type: summary.deviceType ?? "desktop",
      label: summary.deviceLabel ?? "Браузер",
    },
    city: summary.city ?? "—",
    flag: summary.flag ?? "",
    source: summary.source ?? "—",
    firstSeen: fmtChatDay(summary.createdAt),
    sessionStartedAt: fmtChatClock(summary.createdAt),
    path: summary.path ?? [],
    messages,
  };
}

// ===== Page =================================================================

type FilterKind = "all" | "ai" | "operator" | "closed";

function ChatPage() {
  const { data: user } = useQuery({
    queryKey: qk.auth.currentUser,
    queryFn: fetchCurrentUser,
    staleTime: 60_000,
  });
  return (
    <ProductApiGate title="Чат">
      {user ? <ChatPageLive user={user} /> : null}
    </ProductApiGate>
  );
}

function ChatPageLive({ user }: { user: User }) {
  const qc = useQueryClient();
  const tk = user.tenantId!;
  const uid = user.id;

  const sessionsQuery = useQuery({
    queryKey: qk.chat.sessions(tk, uid),
    queryFn: () => apiClient.listChatSessions({ page: 1, pageSize: 50 }),
    staleTime: 30_000,
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKind>("all");
  const [search, setSearch] = useState("");

  const summaries = sessionsQuery.data?.items ?? [];

  useEffect(() => {
    if (!activeId && summaries[0]) setActiveId(summaries[0].id);
  }, [activeId, summaries]);

  const messagesQuery = useQuery({
    queryKey:
      activeId ?
        qk.chat.messages(tk, uid, activeId, 1, 100)
      : (["chat", "messages", "idle"] as const),
    queryFn: () => apiClient.listChatMessages(activeId!, { page: 1, pageSize: 100 }),
    enabled: Boolean(activeId),
    staleTime: 10_000,
  });

  const patchSession = useMutation({
    mutationFn: ({ id, body }: { id: string; body: PatchChatSessionBody }) =>
      apiClient.patchChatSession(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.chat.sessions(tk, uid) });
    },
  });

  const persistMessage = useMutation({
    mutationFn: ({
      sessionId,
      content,
      bubbleWho,
      authorName,
    }: {
      sessionId: string;
      content: string;
      bubbleWho: "operator" | "system";
      authorName?: string;
    }) =>
      apiClient.appendChatPersist(sessionId, {
        content,
        bubbleWho,
        authorName,
      }),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: qk.chat.messagesForSession(tk, uid, vars.sessionId) });
      void qc.invalidateQueries({ queryKey: qk.chat.sessions(tk, uid) });
    },
  });

  const sessions: Session[] = useMemo(() => {
    const activeMessages =
      messagesQuery.data?.items.map(dtoToUiMessage) ?? [];
    return summaries.map((s) =>
      dtoToUiSession(s, s.id === activeId ? activeMessages : []),
    );
  }, [summaries, activeId, messagesQuery.data]);

  const counts = useMemo(
    () => ({
      all: sessions.length,
      ai: sessions.filter((s) => s.status === "ai").length,
      operator: sessions.filter((s) => s.status === "operator").length,
      closed: sessions.filter((s) => s.status === "closed").length,
    }),
    [sessions],
  );

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (filter === "ai" && s.status !== "ai") return false;
      if (filter === "operator" && s.status !== "operator") return false;
      if (filter === "closed" && s.status !== "closed") return false;
      if (search) {
        const q = search.toLowerCase();
        const name = (s.visitorName ?? `Посетитель #${s.number}`).toLowerCase();
        const last = s.messages[s.messages.length - 1]?.text.toLowerCase() ?? "";
        if (!name.includes(q) && !last.includes(q)) return false;
      }
      return true;
    });
  }, [sessions, filter, search]);

  const active = sessions.find((s) => s.id === activeId) ?? filtered[0];

  if (sessionsQuery.isLoading) {
    return <p className="py-12 text-sm text-white/50">Загрузка чатов…</p>;
  }

  if (!summaries.length) {
    return (
      <FeatureEmptyState
        icon={MessageCircle}
        title="Пока нет диалогов"
        description="Подключите виджет на сайт или отправьте тестовое сообщение в онбординге — сессии появятся здесь."
        actionLabel="Пройти онбординг"
        actionTo="/onboarding"
      />
    );
  }

  if (!active) {
    return <p className="py-12 text-sm text-white/50">Выберите сессию</p>;
  }

  const handleSend = (text: string) => {
    void persistMessage.mutateAsync({
      sessionId: active.id,
      content: text,
      bubbleWho: "operator",
      authorName: user.name ?? "Оператор",
    });
  };

  const handleTakeover = async () => {
    await patchSession.mutateAsync({ id: active.id, body: { lane: "operator" } });
    await persistMessage.mutateAsync({
      sessionId: active.id,
      content: "Оператор подключился",
      bubbleWho: "system",
    });
    toast.success("Вы подключились к диалогу");
  };

  const handleHandBack = async () => {
    await patchSession.mutateAsync({ id: active.id, body: { lane: "ai" } });
    await persistMessage.mutateAsync({
      sessionId: active.id,
      content: "Диалог передан ассистенту",
      bubbleWho: "system",
    });
    toast("Диалог передан ассистенту");
  };

  const handleClose = async () => {
    await patchSession.mutateAsync({
      id: active.id,
      body: { lane: "closed", workspaceStatus: "CLOSED" },
    });
    await persistMessage.mutateAsync({
      sessionId: active.id,
      content: "Сессия завершена",
      bubbleWho: "system",
    });
    toast.success("Сессия завершена");
  };

  return (
    <div className="flex h-[calc(100vh-0px)] bg-[#141414] text-white overflow-hidden">
      <SessionsPanel
        sessions={filtered}
        counts={counts}
        activeId={active.id}
        filter={filter}
        search={search}
        onFilter={setFilter}
        onSearch={setSearch}
        onSelect={setActiveId}
      />
      <ChatPanel
        session={active}
        onSend={handleSend}
        onTakeover={() => void handleTakeover()}
        onHandBack={() => void handleHandBack()}
        onClose={() => void handleClose()}
      />
      <ContextPanel session={active} />
    </div>
  );
}

// ===== Sessions panel =======================================================

function SessionsPanel({
  sessions, counts, activeId, filter, search,
  onFilter, onSearch, onSelect,
}: {
  sessions: Session[];
  counts: Record<FilterKind, number>;
  activeId: string;
  filter: FilterKind;
  search: string;
  onFilter: (f: FilterKind) => void;
  onSearch: (s: string) => void;
  onSelect: (id: string) => void;
}) {
  const tabs: Array<[FilterKind, string]> = [
    ["all", "Все"], ["ai", "Ассистент"], ["operator", "Оператор"], ["closed", "Завершённые"],
  ];

  return (
    <aside className="w-[280px] shrink-0 border-r border-[#2a2a2a] bg-[#0f0f0f] flex flex-col">
      <div className="p-3 border-b border-[#2a2a2a]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Поиск…"
            className="pl-9 bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-white/40 h-9"
          />
        </div>
      </div>

      <div className="px-2 py-2 flex gap-1 border-b border-[#2a2a2a] overflow-x-auto">
        {tabs.map(([k, label]) => (
          <button
            key={k}
            onClick={() => onFilter(k)}
            className={cn(
              "shrink-0 text-xs px-2.5 py-1.5 rounded-md inline-flex items-center gap-1.5",
              filter === k
                ? "bg-[#1a1a1a] text-white"
                : "text-white/60 hover:bg-[#1a1a1a] hover:text-white"
            )}
          >
            {label}
            <span className="text-[10px] text-white/50">({counts[k]})</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 && (
          <div className="p-6 text-center text-sm text-white/40">Нет сессий</div>
        )}
        {sessions.map((s) => {
          const color = AVATAR_COLORS[(s.number - 1) % AVATAR_COLORS.length];
          const last = s.messages[s.messages.length - 1];
          const meta = STATUS_META[s.status];
          const active = s.id === activeId;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={cn(
                "w-full text-left flex items-start gap-3 px-3 py-3 border-b border-[#1a1a1a] transition-colors",
                active ? "bg-[#1a1a1a]" : "hover:bg-[#161616]"
              )}
            >
              <div className="relative shrink-0">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center font-semibold text-black text-sm"
                  style={{ background: color }}
                >
                  {s.number}
                </div>
                <span className={cn("absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[#0f0f0f]", meta.dot)} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">
                    {s.visitorName ?? `Посетитель #${s.number}`}
                  </span>
                  <span className="text-[10px] text-white/40 shrink-0">{s.sessionStartedAt}</span>
                </div>
                <div className="text-xs text-white/50 truncate mt-0.5">
                  {last?.text ?? "—"}
                </div>
                <div className="flex items-center justify-between gap-2 mt-1.5">
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded inline-flex items-center gap-1",
                    s.status === "ai" && "bg-[#a8ff57]/10 text-[#a8ff57]",
                    s.status === "operator" && "bg-[#57c7ff]/10 text-[#57c7ff]",
                    s.status === "closed" && "bg-[#2a2a2a] text-white/50",
                  )}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                    {meta.label}
                  </span>
                  {s.unread > 0 && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-500 text-white">
                      {s.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

// ===== Chat panel ===========================================================

function ChatPanel({
  session, onSend, onTakeover, onHandBack, onClose,
}: {
  session: Session;
  onSend: (text: string) => void;
  onTakeover: () => void;
  onHandBack: () => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const color = AVATAR_COLORS[(session.number - 1) % AVATAR_COLORS.length];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session.messages.length]);

  // Auto-resize textarea.
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(160, el.scrollHeight) + "px";
  }, [draft]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  };

  const isClosed = session.status === "closed";

  return (
    <section className="flex-1 min-w-0 flex flex-col bg-[#141414]">
      {/* Header */}
      <header className="px-5 py-3.5 border-b border-[#2a2a2a] flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center font-semibold text-black text-sm shrink-0"
          style={{ background: color }}
        >
          {session.number}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">
            {session.visitorName ?? `Посетитель #${session.number}`}
          </div>
          <div className={cn(
            "text-xs flex items-center gap-1.5 mt-0.5",
            session.status === "ai" && "text-[#a8ff57]",
            session.status === "operator" && "text-[#57c7ff]",
            session.status === "closed" && "text-white/50",
          )}>
            <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_META[session.status].dot)} />
            {session.status === "ai" && "Ассистент отвечает"}
            {session.status === "operator" && "Вы общаетесь"}
            {session.status === "closed" && "Сессия завершена"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm" variant="outline"
            onClick={session.status === "operator" ? onHandBack : onTakeover}
            className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#2a2a2a]"
            disabled={isClosed}
          >
            <ArrowRightLeft className="h-4 w-4 mr-1.5" />
            {session.status === "operator" ? "Передать ассистенту" : "Подключиться"}
          </Button>
          <Button
            size="sm" variant="ghost"
            onClick={onClose}
            className="text-white/70 hover:bg-[#2a2a2a] hover:text-red-400"
            disabled={isClosed}
          >
            <XCircle className="h-4 w-4 mr-1.5" /> Завершить
          </Button>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {session.messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="max-w-sm text-center text-sm text-white/40">
              Это пустая сессия. Сообщения появятся, когда посетитель напишет в виджет.
            </p>
          </div>
        )}
        {session.messages.map((m) => <MessageBubble key={m.id} m={m} />)}
      </div>

      {/* Takeover bar */}
      {!isClosed && (
        <div className={cn(
          "px-5 py-2.5 border-t flex items-center justify-between gap-3 text-sm",
          session.status === "ai"
            ? "border-[#facc15]/30 bg-[#facc15]/10 text-[#facc15]"
            : "border-[#a8ff57]/30 bg-[#a8ff57]/10 text-[#a8ff57]",
        )}>
          <span className="flex items-center gap-2">
            <span className={cn("h-1.5 w-1.5 rounded-full", session.status === "ai" ? "bg-[#facc15]" : "bg-[#a8ff57]")} />
            {session.status === "ai" ? "Ассистент отвечает клиенту" : "Вы общаетесь с клиентом"}
          </span>
          <Button
            size="sm"
            onClick={session.status === "ai" ? onTakeover : onHandBack}
            className={cn(
              "h-7 text-xs",
              session.status === "ai"
                ? "bg-[#facc15] text-black hover:bg-[#facc15]/90"
                : "bg-[#1a1a1a] text-white hover:bg-[#2a2a2a] border border-[#a8ff57]/30",
            )}
          >
            {session.status === "ai" ? "Подключиться" : "Передать ассистенту"}
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-[#2a2a2a] p-3 bg-[#0f0f0f]">
        <div className="flex items-end gap-2 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-1.5">
          <Textarea
            ref={taRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isClosed ? "Сессия завершена" : "Напишите сообщение… (Enter — отправить, Shift+Enter — перенос)"}
            disabled={isClosed}
            rows={1}
            className="flex-1 resize-none border-0 bg-transparent px-1 py-2 text-sm text-white placeholder:text-white/40 focus-visible:ring-0 min-h-[36px]"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={isClosed || !draft.trim()}
            className="h-9 w-9 bg-[#a8ff57] text-black hover:bg-[#a8ff57]/90 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function MessageBubble({ m }: { m: Message }) {
  if (m.who === "system") {
    return (
      <div className="flex justify-center">
        <span className="text-[11px] text-white/40 px-3 py-1 rounded-full bg-[#1a1a1a] border border-[#2a2a2a]">
          {m.text}
        </span>
      </div>
    );
  }

  const right = m.who === "visitor";

  return (
    <div className={cn("flex", right ? "justify-end" : "justify-start")}>
      <div className="max-w-[70%]">
        {!right && (
          <div className={cn(
            "text-[10px] uppercase tracking-wider mb-1 inline-flex items-center gap-1",
            m.who === "ai" ? "text-[#a8ff57]" : "text-[#57c7ff]",
          )}>
            {m.who === "ai" ? <><Sparkles className="h-3 w-3" /> Ассистент</> : <>👤 {m.authorName ?? "Оператор"}</>}
          </div>
        )}
        <div className={cn(
          "px-4 py-2.5 text-sm whitespace-pre-wrap",
          right
            ? "rounded-2xl rounded-tr-sm bg-[#2a2a2a] text-white"
            : m.who === "ai"
              ? "rounded-2xl rounded-tl-sm bg-[#1a1a1a] border border-[#2a2a2a] text-white/90"
              : "rounded-2xl rounded-tl-sm bg-[#57c7ff]/10 border border-[#57c7ff]/30 text-white/90",
        )}>
          {m.text}
        </div>
        <div className={cn("text-[10px] text-white/40 mt-1", right ? "text-right" : "text-left")}>
          {m.at}
        </div>
      </div>
    </div>
  );
}

// ===== Context panel ========================================================

function ContextPanel({ session }: { session: Session }) {
  const [leadOpen, setLeadOpen] = useState(false);
  const [lead, setLead] = useState({ name: session.visitorName ?? "", phone: "", email: "", notes: "" });

  return (
    <aside className="w-[280px] shrink-0 border-l border-[#2a2a2a] bg-[#0f0f0f] flex flex-col overflow-y-auto">
      {/* Visitor info */}
      <div className="p-4 border-b border-[#2a2a2a]">
        <div className="text-xs uppercase tracking-wider text-white/40 mb-3">Посетитель</div>
        <div className="space-y-2 text-sm">
          <Row label="ID" value={`#${session.number}`} mono />
          <Row label="Девайс" value={session.device.label} icon={<DeviceIcon type={session.device.type} />} />
          <Row label="Город" value={`${session.flag} ${session.city}`} />
          <Row label="Источник" value={session.source} />
          <Row label="Первый визит" value={session.firstSeen} />
          <Row label="Сессия" value={session.sessionStartedAt} icon={<Clock className="h-3.5 w-3.5" />} />
        </div>
      </div>

      {/* Page path */}
      <div className="p-4 border-b border-[#2a2a2a]">
        <div className="text-xs uppercase tracking-wider text-white/40 mb-3">Путь по сайту</div>
        <div className="space-y-1.5">
          {session.path.map((p, i) => {
            const isCurrent = i === session.path.length - 1;
            return (
              <div key={i} className={cn(
                "flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs border",
                isCurrent
                  ? "bg-[#a8ff57]/10 border-[#a8ff57]/30 text-white"
                  : "bg-[#1a1a1a] border-[#2a2a2a] text-white/70",
              )}>
                <span className="truncate">
                  {p.title} {isCurrent && <span className="text-[#a8ff57] ml-1">← сейчас</span>}
                </span>
                <span className="text-white/50">{fmtDur(p.seconds)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div className="p-4 border-b border-[#2a2a2a] space-y-2">
        <Button
          onClick={() => { setLeadOpen(true); toast.success("Откройте форму ниже"); }}
          className="w-full bg-[#a8ff57] text-black hover:bg-[#a8ff57]/90 justify-start"
        >
          📋 Добавить в лиды
        </Button>
      </div>

      {/* Lead form */}
      <div className="p-4">
        <button
          onClick={() => setLeadOpen((v) => !v)}
          className="w-full flex items-center justify-between text-xs uppercase tracking-wider text-white/40 hover:text-white/70"
        >
          <span>Форма лида</span>
          {leadOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {leadOpen && (
          <div className="mt-3 space-y-2">
            <Input
              value={lead.name}
              onChange={(e) => setLead({ ...lead, name: e.target.value })}
              placeholder="Имя"
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-white/40 h-9"
            />
            <Input
              value={lead.phone}
              onChange={(e) => setLead({ ...lead, phone: e.target.value })}
              placeholder="Телефон"
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-white/40 h-9"
            />
            <Input
              value={lead.email}
              onChange={(e) => setLead({ ...lead, email: e.target.value })}
              placeholder="Email"
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-white/40 h-9"
            />
            <Textarea
              value={lead.notes}
              onChange={(e) => setLead({ ...lead, notes: e.target.value })}
              placeholder="Заметки"
              rows={3}
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-white/40 resize-none"
            />
            <Button
              onClick={() => toast.success("Лид сохранён")}
              className="w-full bg-[#a8ff57] text-black hover:bg-[#a8ff57]/90"
            >
              Сохранить лид
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}

function Row({ label, value, icon, mono }: { label: string; value: string; icon?: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-white/40">{label}</span>
      <span className={cn("text-white/90 inline-flex items-center gap-1.5 truncate", mono && "font-mono text-xs")}>
        {icon}{value}
      </span>
    </div>
  );
}
