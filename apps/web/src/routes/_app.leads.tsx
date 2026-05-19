/**
 * /app/leads — CRM лиды.
 *
 * Шапка → фильтры → Kanban / таблица → правая панель деталей.
 *
 * При `VITE_LEADS_DATA_SOURCE=api` и реальной авторизации — данные из API.
 * Только API через ProductApiGate.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import {
  Plus,
  Download,
  Search,
  MessageCircle,
  Phone,
  FileText,
  MoreHorizontal,
  X,
  Trash2,
  Send,
  Pencil,
  Calendar,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Bot,
  User as LucideUser,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { qk } from "@/lib/query-keys";
import type { User } from "@/types/entities";
import { ProductApiGate } from "@/components/app/product-api-gate";
import { useLeads, useLeadWorkspaceMutations } from "@/lib/leads/hooks";
import type { CrmLead as Lead, LeadSource, LeadStatus, Task, TimelineEvent } from "@/lib/leads/map-dto";
import { crmLeadToPatch } from "@/lib/leads/map-dto";

export const Route = createFileRoute("/_app/leads")({
  head: () => ({
    meta: [{ title: "Лиды — botme" }],
  }),
  component: LeadsPage,
});

// ===== Types & mocks ========================================================

const AVATAR_COLORS = ["#a8ff57", "#57c7ff", "#ff9f57", "#d57aff", "#ff6b9d", "#5eead4"];

const STATUS_META: Record<LeadStatus, { label: string; color: string; bg: string; border: string }> = {
  new:      { label: "Новый",    color: "#a8ff57", bg: "#a8ff5710", border: "#a8ff5740" },
  working:  { label: "В работе", color: "#57c7ff", bg: "#57c7ff10", border: "#57c7ff40" },
  meeting:  { label: "Встреча",  color: "#facc15", bg: "#facc1510", border: "#facc1540" },
  closed:   { label: "Закрыт",   color: "#86efac", bg: "#86efac10", border: "#86efac40" },
  rejected: { label: "Отказ",    color: "#f87171", bg: "#f8717110", border: "#f8717140" },
};

const SOURCE_META: Record<LeadSource, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  chat: { label: "чат",    icon: MessageCircle },
  call: { label: "звонок", icon: Phone },
  form: { label: "форма",  icon: FileText },
};

const KANBAN_COLUMNS: LeadStatus[] = ["new", "working", "meeting", "closed"];

const MANAGERS = [
  { name: "Мария К.", avatar: "М" },
  { name: "Иван П.",  avatar: "И" },
  { name: "Анна С.",  avatar: "А" },
];


// ===== Page =================================================================

type View = "kanban" | "table";
type StatusFilter = "all" | LeadStatus;
type PeriodFilter = "all" | "today" | "7d" | "30d";

function matchesLeadPeriod(l: Lead, period: PeriodFilter): boolean {
  if (period === "all") return true;
  const t = new Date(l.createdAtIso).getTime();
  if (Number.isNaN(t)) return true;
  const d = new Date(t);
  const now = Date.now();
  const dayMs = 86_400_000;
  if (period === "today") {
    return d.toDateString() === new Date(now).toDateString();
  }
  if (period === "7d") return now - t <= 7 * dayMs;
  if (period === "30d") return now - t <= 30 * dayMs;
  return true;
}

function leadMatchesFilters(
  l: Lead,
  statusFilter: StatusFilter,
  sourceFilter: "all" | LeadSource,
  period: PeriodFilter,
  search: string,
): boolean {
  if (statusFilter !== "all" && l.status !== statusFilter) return false;
  if (sourceFilter !== "all" && l.source !== sourceFilter) return false;
  if (!matchesLeadPeriod(l, period)) return false;
  if (search) {
    const q = search.toLowerCase();
    if (
      !l.name.toLowerCase().includes(q) &&
      !l.phone.toLowerCase().includes(q) &&
      !l.interest.toLowerCase().includes(q)
    ) {
      return false;
    }
  }
  return true;
}


function LeadsChrome(props: {
  leadsTotal: number;
  filtered: Lead[];
  view: View;
  setView: (v: View) => void;
  search: string;
  setSearch: (v: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (v: StatusFilter) => void;
  sourceFilter: "all" | LeadSource;
  setSourceFilter: (v: "all" | LeadSource) => void;
  period: PeriodFilter;
  setPeriod: (v: PeriodFilter) => void;
  openLead: Lead | null;
  setOpenId: (id: string | null) => void;
  moveLead: (id: string, status: LeadStatus) => void;
  updateLead: (next: Lead) => void;
  deleteLead: (id: string) => void;
  exportCsv: () => void;
}) {
  const {
    leadsTotal,
    filtered,
    view,
    setView,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sourceFilter,
    setSourceFilter,
    period,
    setPeriod,
    openLead,
    setOpenId,
    moveLead,
    updateLead,
    deleteLead,
    exportCsv,
  } = props;

  return (
    <div className="min-h-full bg-[#141414] text-white">
      <div className="sticky top-0 z-20 border-b border-[#2a2a2a] bg-[#141414]/95 backdrop-blur">
        <div className="px-6 py-5 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">Лиды</h1>
          <span className="text-sm text-white/50">{leadsTotal} всего</span>
          <div className="flex-1" />
          <Button onClick={exportCsv} variant="outline" className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#2a2a2a]">
            <Download className="h-4 w-4 mr-1.5" /> CSV
          </Button>
          <Button
            onClick={() => toast("Откройте чат, чтобы создать лид из диалога")}
            className="bg-[#a8ff57] text-black hover:bg-[#a8ff57]/90"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Добавить лид
          </Button>
        </div>

        <div className="px-6 pb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по имени, телефону, интересу…"
              className="pl-9 bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-white/40 h-9"
            />
          </div>

          <FilterSelect
            label="Статус"
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            options={[
              { value: "all", label: "Все" },
              { value: "new", label: "Новый" },
              { value: "working", label: "В работе" },
              { value: "meeting", label: "Встреча" },
              { value: "closed", label: "Закрыт" },
              { value: "rejected", label: "Отказ" },
            ]}
          />
          <FilterSelect
            label="Источник"
            value={sourceFilter}
            onValueChange={(v) => setSourceFilter(v as "all" | LeadSource)}
            options={[
              { value: "all", label: "Все" },
              { value: "chat", label: "Чат" },
              { value: "call", label: "Звонок" },
              { value: "form", label: "Форма" },
            ]}
          />
          <FilterSelect
            label="Период"
            value={period}
            onValueChange={(v) => setPeriod(v as PeriodFilter)}
            options={[
              { value: "all", label: "Всё время" },
              { value: "today", label: "Сегодня" },
              { value: "7d", label: "7 дней" },
              { value: "30d", label: "30 дней" },
            ]}
          />

          <div className="flex-1" />

          <div className="inline-flex rounded-md border border-[#2a2a2a] bg-[#1a1a1a] p-1">
            <button
              type="button"
              onClick={() => setView("kanban")}
              className={cn("px-3 py-1.5 text-sm rounded", view === "kanban" ? "bg-[#2a2a2a] text-white" : "text-white/60 hover:text-white")}
            >Kanban</button>
            <button
              type="button"
              onClick={() => setView("table")}
              className={cn("px-3 py-1.5 text-sm rounded", view === "table" ? "bg-[#2a2a2a] text-white" : "text-white/60 hover:text-white")}
            >Таблица</button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {view === "kanban" ? (
          <KanbanView leads={filtered} onOpen={setOpenId} onMove={moveLead} />
        ) : (
          <TableView leads={filtered} onOpen={setOpenId} />
        )}
      </div>

      {openLead && (
        <DetailPanel
          lead={openLead}
          onClose={() => setOpenId(null)}
          onUpdate={updateLead}
          onDelete={() => deleteLead(openLead.id)}
        />
      )}
    </div>
  );
}


function LeadsPageLive({ user }: { user: User }) {
  const { data: leads = [], isPending, isError } = useLeads(user);
  const { patchLead, archiveLead } = useLeadWorkspaceMutations(user);
  const [view, setView] = useState<View>("kanban");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | LeadSource>("all");
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(
    () => leads.filter((l) => leadMatchesFilters(l, statusFilter, sourceFilter, period, search)),
    [leads, statusFilter, sourceFilter, period, search],
  );

  const openLead = leads.find((l) => l.id === openId) ?? null;

  const updateLead = (next: Lead) => {
    patchLead.mutate(
      { id: next.id, patch: crmLeadToPatch(next) },
      { onError: () => toast.error("Не удалось сохранить изменения") },
    );
  };

  const moveLead = (id: string, status: LeadStatus) => {
    patchLead.mutate(
      { id, patch: { pipelineStatus: status } },
      {
        onSuccess: () => toast.success(`Перенесено в «${STATUS_META[status].label}»`),
        onError: () => toast.error("Не удалось обновить статус"),
      },
    );
  };

  const deleteLead = (id: string) => {
    archiveLead.mutate(id, {
      onSuccess: () => {
        setOpenId(null);
        toast.success("Лид удалён");
      },
      onError: () => toast.error("Не удалось удалить лид"),
    });
  };

  const exportCsv = () => {
    const headers = ["ID", "Имя", "Телефон", "Email", "Источник", "Интерес", "Статус", "Менеджер", "Создан"];
    const rows = filtered.map((l) => [
      l.number, l.name, l.phone, l.email ?? "",
      SOURCE_META[l.source].label, l.interest,
      STATUS_META[l.status].label, l.manager.name, l.createdAt,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "leads.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV экспортирован");
  };

  if (isPending) {
    return (
      <div className="min-h-full bg-[#141414] text-white flex items-center justify-center p-12">
        <p className="text-white/60">Загрузка лидов…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-full bg-[#141414] text-white flex items-center justify-center p-12">
        <p className="text-red-400">Не удалось загрузить лиды</p>
      </div>
    );
  }

  return (
    <LeadsChrome
      leadsTotal={leads.length}
      filtered={filtered}
      view={view}
      setView={setView}
      search={search}
      setSearch={setSearch}
      statusFilter={statusFilter}
      setStatusFilter={setStatusFilter}
      sourceFilter={sourceFilter}
      setSourceFilter={setSourceFilter}
      period={period}
      setPeriod={setPeriod}
      openLead={openLead}
      setOpenId={setOpenId}
      moveLead={moveLead}
      updateLead={updateLead}
      deleteLead={deleteLead}
      exportCsv={exportCsv}
    />
  );
}

function LeadsPage() {
  const { data: user } = useQuery<User | null>({ queryKey: qk.auth.currentUser });
  return (
    <ProductApiGate title="Лиды">
      {user ? <LeadsPageLive user={user} /> : null}
    </ProductApiGate>
  );
}

// ===== Filter select ========================================================

function FilterSelect({
  label, value, onValueChange, options,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-white/40">{label}:</span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-9 min-w-[130px] bg-[#1a1a1a] border-[#2a2a2a] text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
          {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

// ===== Kanban view ==========================================================

function KanbanView({
  leads, onOpen, onMove,
}: {
  leads: Lead[];
  onOpen: (id: string) => void;
  onMove: (id: string, status: LeadStatus) => void;
}) {
  const dragId = useRef<string | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {KANBAN_COLUMNS.map((status) => {
        const items = leads.filter((l) => l.status === status);
        const meta = STATUS_META[status];
        return (
          <div
            key={status}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragId.current) onMove(dragId.current, status);
              dragId.current = null;
            }}
            className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a]/40 flex flex-col min-h-[400px]"
          >
            <div className="px-3 py-2.5 border-b border-[#2a2a2a] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
                <span className="text-sm font-medium">{meta.label}</span>
              </div>
              <span className="text-xs text-white/50 px-1.5 py-0.5 rounded bg-[#2a2a2a]">{items.length}</span>
            </div>
            <div className="p-2 space-y-2 flex-1 overflow-y-auto">
              {items.length === 0 && (
                <div className="text-center text-xs text-white/30 py-8">Нет лидов</div>
              )}
              {items.map((lead) => (
                <KanbanCard
                  key={lead.id}
                  lead={lead}
                  onOpen={() => onOpen(lead.id)}
                  onDragStart={() => { dragId.current = lead.id; }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({
  lead, onOpen, onDragStart,
}: {
  lead: Lead;
  onOpen: () => void;
  onDragStart: () => void;
}) {
  const color = AVATAR_COLORS[(lead.number - 1) % AVATAR_COLORS.length];
  const SourceIcon = SOURCE_META[lead.source].icon;
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onOpen}
      className="group rounded-md border border-[#2a2a2a] bg-[#1a1a1a] p-3 cursor-pointer hover:border-[#3a3a3a] hover:bg-[#1f1f1f] transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="text-sm font-medium text-white truncate">{lead.name}</div>
          <div className="text-xs text-white/60 mt-0.5">{lead.phone}</div>
        </div>
        <span
          className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border shrink-0"
          style={{ background: STATUS_META[lead.status].bg, borderColor: STATUS_META[lead.status].border, color: STATUS_META[lead.status].color }}
        >
          <SourceIcon className="h-2.5 w-2.5" />
          {SOURCE_META[lead.source].label}
        </span>
      </div>

      <div className="text-xs text-white/80 line-clamp-2 mb-2">{lead.interest}</div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-white/40">{lead.createdAgo}</span>
        <div className="flex items-center gap-1">
          <div
            className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-semibold text-black"
            style={{ background: color }}
            title={lead.manager.name}
          >
            {lead.manager.avatar}
          </div>
          <div className="opacity-0 group-hover:opacity-100 flex transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); toast("Чат открыт"); }} className="p-1 rounded hover:bg-[#2a2a2a] text-white/60" title="Чат">
              <MessageCircle className="h-3.5 w-3.5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); toast("Звоним…"); }} className="p-1 rounded hover:bg-[#2a2a2a] text-white/60" title="Позвонить">
              <Phone className="h-3.5 w-3.5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onOpen(); }} className="p-1 rounded hover:bg-[#2a2a2a] text-white/60" title="Меню">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Table view ===========================================================

type SortKey = "name" | "phone" | "source" | "interest" | "status" | "manager" | "createdAt";

function TableView({ leads, onOpen }: { leads: Lead[]; onOpen: (id: string) => void }) {
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const arr = [...leads];
    arr.sort((a, b) => {
      const av = sortKey === "manager" ? a.manager.name : (a as any)[sortKey] as string;
      const bv = sortKey === "manager" ? b.manager.name : (b as any)[sortKey] as string;
      if (sortKey === "createdAt") {
        // approximate: keep mock order with reversal
        return sortDir === "asc" ? a.number - b.number : b.number - a.number;
      }
      const cmp = String(av).localeCompare(String(bv), "ru");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [leads, sortKey, sortDir]);

  const toggle = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("asc"); }
  };

  const Th = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <th
      onClick={() => toggle(k)}
      className="text-left p-3 font-medium cursor-pointer select-none hover:text-white"
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortKey === k && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
      </span>
    </th>
  );

  return (
    <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[#141414] text-white/60">
          <tr>
            <Th k="name">Имя</Th>
            <Th k="phone">Телефон</Th>
            <Th k="source">Источник</Th>
            <Th k="interest">Интерес</Th>
            <Th k="status">Статус</Th>
            <Th k="manager">Менеджер</Th>
            <Th k="createdAt">Дата</Th>
            <th className="w-32 p-3"></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((l) => {
            const SourceIcon = SOURCE_META[l.source].icon;
            const meta = STATUS_META[l.status];
            const color = AVATAR_COLORS[(l.number - 1) % AVATAR_COLORS.length];
            return (
              <tr
                key={l.id}
                onClick={() => onOpen(l.id)}
                className="border-t border-[#2a2a2a] hover:bg-[#222] cursor-pointer"
              >
                <td className="p-3 font-medium">{l.name}</td>
                <td className="p-3 text-white/70">{l.phone}</td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-white/70">
                    <SourceIcon className="h-3.5 w-3.5" />
                    {SOURCE_META[l.source].label}
                  </span>
                </td>
                <td className="p-3 text-white/80 max-w-xs truncate">{l.interest}</td>
                <td className="p-3">
                  <span
                    className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border"
                    style={{ background: meta.bg, borderColor: meta.border, color: meta.color }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
                    {meta.label}
                  </span>
                </td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-2 text-white/80">
                    <span
                      className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-semibold text-black"
                      style={{ background: color }}
                    >{l.manager.avatar}</span>
                    {l.manager.name}
                  </span>
                </td>
                <td className="p-3 text-white/50">{l.createdAgo}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={(e) => { e.stopPropagation(); toast("Чат открыт"); }} className="p-1.5 rounded hover:bg-[#2a2a2a] text-white/70"><MessageCircle className="h-4 w-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); toast("Звоним…"); }} className="p-1.5 rounded hover:bg-[#2a2a2a] text-white/70"><Phone className="h-4 w-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); onOpen(l.id); }} className="p-1.5 rounded hover:bg-[#2a2a2a] text-white/70"><MoreHorizontal className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            );
          })}
          {sorted.length === 0 && (
            <tr><td colSpan={8} className="p-8 text-center text-white/40">Лидов не найдено</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ===== Detail panel =========================================================

function DetailPanel({
  lead, onClose, onUpdate, onDelete,
}: {
  lead: Lead;
  onClose: () => void;
  onUpdate: (l: Lead) => void;
  onDelete: () => void;
}) {
  const [editName, setEditName] = useState(false);
  const [crmOpen, setCrmOpen] = useState(false);
  const color = AVATAR_COLORS[(lead.number - 1) % AVATAR_COLORS.length];

  const set = <K extends keyof Lead>(k: K, v: Lead[K]) => onUpdate({ ...lead, [k]: v });

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-[520px] bg-[#0f0f0f] border-l border-[#2a2a2a] flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="p-5 border-b border-[#2a2a2a] flex items-start gap-3">
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center font-semibold text-black shrink-0"
            style={{ background: color }}
          >
            {lead.name.slice(0, 1)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-white/40 uppercase tracking-wider mb-0.5">Лид #{lead.number}</div>
            {editName ? (
              <Input
                autoFocus
                value={lead.name}
                onChange={(e) => set("name", e.target.value)}
                onBlur={() => setEditName(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditName(false)}
                className="bg-transparent border-0 text-lg font-semibold text-white px-0 focus-visible:ring-0 h-auto"
              />
            ) : (
              <button
                onClick={() => setEditName(true)}
                className="text-lg font-semibold text-white inline-flex items-center gap-2 hover:text-white/80"
              >
                {lead.name}
                <Pencil className="h-3.5 w-3.5 text-white/40" />
              </button>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-[#2a2a2a] text-white/60">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Status selector */}
        <div className="px-5 py-3 border-b border-[#2a2a2a] flex items-center gap-3">
          <span className="text-xs text-white/40 uppercase tracking-wider">Статус</span>
          <Select value={lead.status} onValueChange={(v) => set("status", v as LeadStatus)}>
            <SelectTrigger
              className="h-9 flex-1 bg-[#1a1a1a] border text-white"
              style={{ borderColor: STATUS_META[lead.status].border, color: STATUS_META[lead.status].color }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
              {(Object.keys(STATUS_META) as LeadStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: STATUS_META[s].color }} />
                    {STATUS_META[s].label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-5 mt-3 bg-[#1a1a1a] border border-[#2a2a2a] grid grid-cols-3">
            <TabsTrigger value="info" className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white">Инфо</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white">История</TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white">Задачи</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="info" className="p-5 space-y-5 m-0">
              <InfoTab lead={lead} onUpdate={onUpdate} />
            </TabsContent>
            <TabsContent value="history" className="p-5 m-0">
              <HistoryTab lead={lead} />
            </TabsContent>
            <TabsContent value="tasks" className="p-5 m-0">
              <TasksTab lead={lead} onUpdate={onUpdate} />
            </TabsContent>
          </div>
        </Tabs>

        {/* Bottom bar */}
        <div className="p-4 border-t border-[#2a2a2a] flex gap-2">
          <Button variant="ghost" onClick={onDelete} className="text-red-400 hover:bg-red-500/10">
            <Trash2 className="h-4 w-4 mr-1.5" /> Удалить
          </Button>
          <Button variant="outline" onClick={() => toast.success("Экспортировано")} className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#2a2a2a]">
            <Download className="h-4 w-4 mr-1.5" /> Экспорт
          </Button>
          <div className="flex-1" />
          <Button onClick={() => setCrmOpen(true)} className="bg-[#a8ff57] text-black hover:bg-[#a8ff57]/90">
            <Send className="h-4 w-4 mr-1.5" /> Отправить в CRM
          </Button>
        </div>
      </aside>

      <CrmModal open={crmOpen} onClose={() => setCrmOpen(false)} leadName={lead.name} />
    </div>
  );
}

// ===== Tabs =================================================================

function InfoTab({ lead, onUpdate }: { lead: Lead; onUpdate: (l: Lead) => void }) {
  const [tagInput, setTagInput] = useState("");
  const set = <K extends keyof Lead>(k: K, v: Lead[K]) => onUpdate({ ...lead, [k]: v });

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || lead.tags.includes(t)) return;
    set("tags", [...lead.tags, t]);
    setTagInput("");
  };

  return (
    <>
      <Field label="Телефон">
        <Input
          value={lead.phone}
          onChange={(e) => set("phone", e.target.value)}
          className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-9"
        />
      </Field>
      <Field label="Email">
        <Input
          value={lead.email ?? ""}
          onChange={(e) => set("email", e.target.value)}
          placeholder="—"
          className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-white/40 h-9"
        />
      </Field>

      <div>
        <div className="text-xs uppercase tracking-wider text-white/40 mb-2">Источник / UTM</div>
        <div className="rounded-md border border-[#2a2a2a] bg-[#1a1a1a] p-3 space-y-1.5 text-sm">
          <Row label="Канал" value={SOURCE_META[lead.source].label} />
          <Row label="source"   value={lead.utm?.source ?? "—"} mono />
          <Row label="medium"   value={lead.utm?.medium ?? "—"} mono />
          <Row label="campaign" value={lead.utm?.campaign ?? "—"} mono />
        </div>
      </div>

      <Field label="Интерес">
        <Textarea
          value={lead.interest}
          onChange={(e) => set("interest", e.target.value)}
          rows={2}
          className="bg-[#1a1a1a] border-[#2a2a2a] text-white resize-none"
        />
      </Field>

      <Field label="Заметки">
        <Textarea
          value={lead.notes ?? ""}
          onChange={(e) => set("notes", e.target.value)}
          rows={4}
          placeholder="Добавьте заметки о клиенте…"
          className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-white/40 resize-none"
        />
      </Field>

      <Field label="Теги">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {lead.tags.map((t) => (
            <span key={t} className="text-xs px-2 py-1 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] text-white/80 inline-flex items-center gap-1">
              {t}
              <button onClick={() => set("tags", lead.tags.filter((x) => x !== t))} className="text-white/40 hover:text-white">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {lead.tags.length === 0 && <span className="text-sm text-white/40">Нет тегов</span>}
        </div>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            placeholder="Добавить тег и Enter"
            className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-white/40 h-9"
          />
          <Button size="sm" onClick={addTag} variant="secondary" className="bg-[#2a2a2a] hover:bg-[#333] text-white">+</Button>
        </div>
      </Field>

      <Field label="Менеджер">
        <Select
          value={lead.manager.name}
          onValueChange={(v) => {
            const m = MANAGERS.find((x) => x.name === v);
            if (m) set("manager", m);
          }}
        >
          <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
            {MANAGERS.map((m) => (
              <SelectItem key={m.name} value={m.name}>
                <span className="inline-flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-[#a8ff57] text-black text-[10px] font-semibold inline-flex items-center justify-center">
                    {m.avatar}
                  </span>
                  {m.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </>
  );
}

function HistoryTab({ lead }: { lead: Lead }) {
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  const eventIcon = (kind: TimelineEvent["kind"]) => {
    if (kind === "ai") return <Bot className="h-3.5 w-3.5 text-[#a8ff57]" />;
    if (kind === "visitor") return <MessageCircle className="h-3.5 w-3.5 text-white/70" />;
    if (kind === "operator") return <LucideUser className="h-3.5 w-3.5 text-[#57c7ff]" />;
    if (kind === "call") return <Video className="h-3.5 w-3.5 text-[#facc15]" />;
    return <CheckCircle2 className="h-3.5 w-3.5 text-[#86efac]" />;
  };

  return (
    <>
      <div className="text-xs uppercase tracking-wider text-white/40 mb-3">Таймлайн</div>
      <ol className="relative border-l border-[#2a2a2a] ml-2 space-y-3 pb-2">
        {lead.timeline.map((e) => (
          <li key={e.id} className="ml-4">
            <span className="absolute -left-[7px] flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#1a1a1a] border border-[#2a2a2a]">
              {eventIcon(e.kind)}
            </span>
            <div className="text-sm text-white/90">{e.text}</div>
            <div className="text-[11px] text-white/40 mt-0.5">{e.at}</div>
          </li>
        ))}
      </ol>

      <div className="mt-5">
        <button
          onClick={() => setTranscriptOpen((v) => !v)}
          className="w-full flex items-center justify-between text-xs uppercase tracking-wider text-white/40 hover:text-white/70"
        >
          <span>Полный транскрипт диалога</span>
          {transcriptOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {transcriptOpen && (
          <div className="mt-3 rounded-md border border-[#2a2a2a] bg-[#1a1a1a] p-3 space-y-2 text-sm">
            {lead.timeline.filter((e) => e.kind === "visitor" || e.kind === "ai" || e.kind === "operator").map((e) => (
              <div key={e.id} className="flex gap-2">
                <span className="text-[10px] uppercase tracking-wider text-white/40 shrink-0 mt-0.5 w-16">
                  {e.kind === "visitor" ? "Клиент" : e.kind === "ai" ? "AI" : "Оператор"}
                </span>
                <span className="text-white/85">{e.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function TasksTab({ lead, onUpdate }: { lead: Lead; onUpdate: (l: Lead) => void }) {
  const [text, setText] = useState("");
  const [due, setDue] = useState("");

  const add = () => {
    const t = text.trim();
    if (!t) return;
    const next: Task = { id: `tk${Date.now()}`, text: t, due: due || "без срока", done: false };
    onUpdate({ ...lead, tasks: [...lead.tasks, next] });
    setText(""); setDue("");
    toast.success("Задача добавлена");
  };

  const toggle = (id: string) => {
    onUpdate({
      ...lead,
      tasks: lead.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    });
  };

  const remove = (id: string) => {
    onUpdate({ ...lead, tasks: lead.tasks.filter((t) => t.id !== id) });
  };

  return (
    <>
      <div className="space-y-2 mb-5">
        {lead.tasks.length === 0 && (
          <div className="text-sm text-white/40 text-center py-6">Нет задач</div>
        )}
        {lead.tasks.map((t) => (
          <div
            key={t.id}
            className="flex items-start gap-2 rounded-md border border-[#2a2a2a] bg-[#1a1a1a] p-3"
          >
            <button onClick={() => toggle(t.id)} className="mt-0.5">
              {t.done
                ? <CheckCircle2 className="h-4 w-4 text-[#a8ff57]" />
                : <Circle className="h-4 w-4 text-white/40" />}
            </button>
            <div className="flex-1 min-w-0">
              <div className={cn("text-sm", t.done ? "text-white/40 line-through" : "text-white/90")}>
                {t.text}
              </div>
              <div className="text-[11px] text-white/40 mt-0.5 inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {t.due}
              </div>
            </div>
            <button onClick={() => remove(t.id)} className="p-1 rounded hover:bg-[#2a2a2a] text-white/40 hover:text-red-400">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-md border border-[#2a2a2a] bg-[#1a1a1a] p-3 space-y-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Что нужно сделать?"
          className="bg-[#0f0f0f] border-[#2a2a2a] text-white placeholder:text-white/40 h-9"
        />
        <div className="flex gap-2">
          <Input
            value={due}
            onChange={(e) => setDue(e.target.value)}
            placeholder="Срок (например, завтра 18:00)"
            className="bg-[#0f0f0f] border-[#2a2a2a] text-white placeholder:text-white/40 h-9"
          />
          <Button onClick={add} className="bg-[#a8ff57] text-black hover:bg-[#a8ff57]/90 h-9">
            <Plus className="h-4 w-4 mr-1" /> Добавить задачу
          </Button>
        </div>
      </div>
    </>
  );
}

// ===== CRM modal ============================================================

function CrmModal({ open, onClose, leadName }: { open: boolean; onClose: () => void; leadName: string }) {
  const [picked, setPicked] = useState<"amocrm" | "bitrix24" | null>(null);

  const send = () => {
    if (!picked) return;
    toast.success(`«${leadName}» отправлен в ${picked === "amocrm" ? "amoCRM" : "Bitrix24"}`);
    onClose();
    setPicked(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#0f0f0f] border-[#2a2a2a] text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Отправить в CRM</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          {([
            { id: "amocrm",   name: "amoCRM",   desc: "Передать как сделку" },
            { id: "bitrix24", name: "Bitrix24", desc: "Создать лид + контакт" },
          ] as const).map((opt) => (
            <button
              key={opt.id}
              onClick={() => setPicked(opt.id)}
              className={cn(
                "rounded-lg border p-4 text-left transition-colors",
                picked === opt.id
                  ? "border-[#a8ff57] bg-[#a8ff57]/5"
                  : "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a]",
              )}
            >
              <div className="text-base font-medium text-white">{opt.name}</div>
              <div className="text-xs text-white/50 mt-1">{opt.desc}</div>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} className="text-white/70 hover:bg-[#2a2a2a]">Отмена</Button>
          <Button onClick={send} disabled={!picked} className="bg-[#a8ff57] text-black hover:bg-[#a8ff57]/90 disabled:opacity-40">
            Отправить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ===== Misc helpers =========================================================

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-white/40 mb-2">{label}</div>
      {children}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-white/40">{label}</span>
      <span className={cn("text-white/85 truncate", mono && "font-mono text-xs")}>{value}</span>
    </div>
  );
}
