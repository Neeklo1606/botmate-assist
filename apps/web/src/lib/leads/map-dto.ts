import type { LeadDto } from "@botmate/shared";

export type LeadStatus = "new" | "working" | "meeting" | "closed" | "rejected";
export type LeadSource = "chat" | "call" | "form";

export interface TimelineEvent {
  id: string;
  kind: "ai" | "visitor" | "operator" | "call" | "system";
  text: string;
  at: string;
}

export interface Task {
  id: string;
  text: string;
  due: string;
  done: boolean;
}

/** CRM surface shape used by `_app.leads` (Kanban + drawer). */
export interface CrmLead {
  id: string;
  /** ISO 8601 — filters / analytics */
  createdAtIso: string;
  number: number;
  name: string;
  phone: string;
  email?: string;
  source: LeadSource;
  interest: string;
  status: LeadStatus;
  manager: { name: string; avatar: string };
  createdAt: string;
  createdAgo: string;
  utm?: { source?: string; medium?: string; campaign?: string };
  notes?: string;
  tags: string[];
  timeline: TimelineEvent[];
  tasks: Task[];
}

function asObj(raw: unknown): Record<string, unknown> {
  if (raw !== null && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

function fmtClock(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function fmtRelative(iso: string): string {
  try {
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
    const diffSec = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
    const abs = Math.abs(diffSec);
    if (abs < 60) return rtf.format(Math.round(diffSec / 60), "minute");
    if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
    if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
    return rtf.format(Math.round(diffSec / 86400), "day");
  } catch {
    return iso;
  }
}

function mapSource(src: LeadDto["source"]): LeadSource {
  if (src === "chat" || src === "call" || src === "form") return src;
  return "chat";
}

function mapPipeline(st: LeadDto["pipelineStatus"]): LeadStatus {
  return st as LeadStatus;
}

function leadDisplayNumber(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return 10000 + (h % 90000);
}

export function legacyLeadToCrmLead(e: import("@/types/entities").Lead): CrmLead {
  const statusMap: Record<import("@/types/entities").LeadStatus, LeadStatus> = {
    new: "new",
    qualified: "working",
    won: "closed",
    lost: "rejected",
  };
  const sourceMap: Partial<Record<import("@/types/entities").ChannelId, LeadSource>> = {
    telegram: "chat",
    website: "form",
    whatsapp: "chat",
    vk: "chat",
    instagram: "chat",
    avito: "call",
  };
  const iso = e.createdAt;
  return {
    id: e.id,
    createdAtIso: iso,
    number: leadDisplayNumber(e.id),
    name: e.contact.split(/[,|]/)[0]?.trim() || e.contact,
    phone: e.contact,
    source: sourceMap[e.channel] ?? "chat",
    interest: e.summary,
    status: statusMap[e.status],
    manager: { name: "Демо", avatar: "Д" },
    createdAt: fmtClock(iso),
    createdAgo: fmtRelative(iso),
    tags: [],
    timeline: [],
    tasks: [],
  };
}

export function dtoToCrmLead(dto: LeadDto): CrmLead {
  const metaRoot = asObj(dto.metadata);
  const crm = asObj(metaRoot.crm);

  const tagsRaw = crm.tags;
  const tags = Array.isArray(tagsRaw)
    ? tagsRaw.filter((t): t is string => typeof t === "string")
    : [];

  const timelineRaw = crm.timeline;
  const timeline: TimelineEvent[] = Array.isArray(timelineRaw)
    ? timelineRaw
        .map((item): TimelineEvent | null => {
          const o = asObj(item);
          const id = typeof o.id === "string" ? o.id : "";
          const kind = o.kind as TimelineEvent["kind"];
          const text = typeof o.text === "string" ? o.text : "";
          const at = typeof o.at === "string" ? o.at : "";
          if (!id || !text) return null;
          if (kind !== "ai" && kind !== "visitor" && kind !== "operator" && kind !== "call" && kind !== "system") {
            return null;
          }
          return { id, kind, text, at };
        })
        .filter((x): x is TimelineEvent => x !== null)
    : [];

  const tasksRaw = crm.tasks;
  const tasks: Task[] = Array.isArray(tasksRaw)
    ? tasksRaw
        .map((item): Task | null => {
          const o = asObj(item);
          const id = typeof o.id === "string" ? o.id : "";
          const text = typeof o.text === "string" ? o.text : "";
          const due = typeof o.due === "string" ? o.due : "";
          const done = typeof o.done === "boolean" ? o.done : false;
          if (!id || !text) return null;
          return { id, text, due, done };
        })
        .filter((x): x is Task => x !== null)
    : [];

  const notes = typeof crm.notes === "string" ? crm.notes : undefined;
  const managerName = typeof crm.managerName === "string" ? crm.managerName : dto.ownerName ?? "Не назначен";
  const managerAvatar =
    typeof crm.managerAvatar === "string" ? crm.managerAvatar : (managerName.trim().charAt(0) || "?");

  const attr = dto.attribution ?? {};
  const utm =
    typeof attr.source === "string" || typeof attr.medium === "string" || typeof attr.campaign === "string"
      ? {
          source: typeof attr.source === "string" ? attr.source : undefined,
          medium: typeof attr.medium === "string" ? attr.medium : undefined,
          campaign: typeof attr.campaign === "string" ? attr.campaign : undefined,
        }
      : undefined;

  const phone = dto.phone?.trim() || dto.contact.trim();
  const email = dto.email ?? undefined;

  return {
    id: dto.id,
    createdAtIso: dto.createdAt,
    number: dto.displayNumber,
    name: dto.name,
    phone,
    email,
    source: mapSource(dto.source),
    interest: dto.interest || dto.summary || "—",
    status: mapPipeline(dto.pipelineStatus),
    manager: { name: managerName, avatar: managerAvatar },
    createdAt: fmtClock(dto.createdAt),
    createdAgo: fmtRelative(dto.createdAt),
    utm,
    notes,
    tags,
    timeline,
    tasks,
  };
}

export function crmLeadToPatch(from: CrmLead): import("@botmate/shared").PatchLeadBody {
  return {
    pipelineStatus: from.status,
    source:
      from.source === "chat"
        ? "chat"
        : from.source === "call"
          ? "call"
          : from.source === "form"
            ? "form"
            : "other",
    name: from.name,
    contact: from.phone,
    email: from.email ?? null,
    interest: from.interest,
    notes: from.notes ?? "",
    metadataPatch: {
      crm: {
        tags: from.tags,
        timeline: from.timeline,
        tasks: from.tasks,
        managerName: from.manager.name,
        managerAvatar: from.manager.avatar,
      },
    },
    ...(from.utm
      ? {
          attributionPatch: {
            ...(from.utm.source ? { source: from.utm.source } : {}),
            ...(from.utm.medium ? { medium: from.utm.medium } : {}),
            ...(from.utm.campaign ? { campaign: from.utm.campaign } : {}),
          },
        }
      : {}),
  };
}
