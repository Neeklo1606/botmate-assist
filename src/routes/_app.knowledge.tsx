/**
 * /app/knowledge — knowledge management interface.
 *
 * Layout:
 *  - Left sidebar (300px): search, categories, tag cloud, "+ Добавить".
 *  - Main area: Graph view (default) / List view toggle.
 *  - Right slide-in editor (520px) on document click.
 *  - Upload modal triggered by "+ Добавить".
 *
 * All data is mocked (see MOCK_DOCS / MOCK_CATEGORIES / MOCK_TAGS).
 * TODO: replace with real API
 */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Plus,
  Network,
  List as ListIcon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Bold,
  Italic,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  List as ListBulletIcon,
  Code,
  Trash2,
  Pencil,
  Eye,
  Upload,
  FileText,
  Folder,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/knowledge")({
  component: KnowledgePage,
});

// ===== Mock data ============================================================

type Category = "products" | "pricing" | "faq" | "contacts";

interface DocNode {
  id: string;
  title: string;
  category: Category;
  type: "md" | "url" | "pdf" | "txt";
  words: number;
  updated: string;
  tags: string[];
  importance: number; // 1..3 → node radius
  body: string;
  related: string[]; // ids
  assistants: string[];
}

const CATEGORY_META: Record<
  Category,
  { label: string; color: string; emoji: string }
> = {
  products: { label: "Продукты", color: "#a8ff57", emoji: "📁" },
  pricing: { label: "Цены", color: "#57c7ff", emoji: "📁" },
  faq: { label: "FAQ", color: "#ff9f57", emoji: "📁" },
  contacts: { label: "Контакты", color: "#d57aff", emoji: "📁" },
};

// TODO: replace with real API
const MOCK_DOCS: DocNode[] = [
  { id: "d1", title: "Каталог однушек", category: "products", type: "md", words: 1240, updated: "2 ч назад", tags: ["новостройка", "1к"], importance: 3, body: "# Однокомнатные квартиры\n\nПлощадь 30–42 м²...", related: ["d2", "d3"], assistants: ["Алекс"] },
  { id: "d2", title: "Каталог двушек", category: "products", type: "md", words: 1580, updated: "вчера", tags: ["новостройка", "2к"], importance: 3, body: "# Двухкомнатные...", related: ["d1", "d4"], assistants: ["Алекс"] },
  { id: "d3", title: "Планировки", category: "products", type: "pdf", words: 420, updated: "3 дня", tags: ["pdf"], importance: 2, body: "Планировки доступны в PDF...", related: ["d1", "d2"], assistants: ["Алекс"] },
  { id: "d4", title: "Отделка и материалы", category: "products", type: "md", words: 870, updated: "неделю назад", tags: ["отделка"], importance: 2, body: "Используем европейские материалы...", related: ["d2"], assistants: ["Алекс"] },
  { id: "d5", title: "Прайс-лист 2026", category: "pricing", type: "md", words: 540, updated: "сегодня", tags: ["price", "2026"], importance: 3, body: "Стоимость м² от 180 000 ₽...", related: ["d6", "d1"], assistants: ["Алекс", "Мария"] },
  { id: "d6", title: "Ипотека и рассрочка", category: "pricing", type: "md", words: 720, updated: "вчера", tags: ["ипотека"], importance: 2, body: "Партнёрские банки: Сбер, ВТБ...", related: ["d5", "d7"], assistants: ["Мария"] },
  { id: "d7", title: "Скидки и акции", category: "pricing", type: "md", words: 310, updated: "2 дня", tags: ["скидка"], importance: 1, body: "Текущая акция: −5% при 100% оплате...", related: ["d5"], assistants: ["Мария"] },
  { id: "d8", title: "Как купить квартиру", category: "faq", type: "md", words: 980, updated: "вчера", tags: ["faq", "покупка"], importance: 3, body: "Шаг 1. Выбор...", related: ["d5", "d9"], assistants: ["Алекс"] },
  { id: "d9", title: "Как происходит оплата", category: "faq", type: "md", words: 460, updated: "3 дня", tags: ["faq", "оплата"], importance: 2, body: "Оплата через эскроу-счёт...", related: ["d8", "d6"], assistants: ["Алекс"] },
  { id: "d10", title: "Когда сдача дома", category: "faq", type: "md", words: 220, updated: "5 дней", tags: ["faq", "сдача"], importance: 1, body: "Очередь 1 — IV квартал 2026...", related: ["d8"], assistants: ["Алекс"] },
  { id: "d11", title: "Возврат средств", category: "faq", type: "md", words: 380, updated: "неделю", tags: ["faq", "возврат"], importance: 1, body: "Согласно 214-ФЗ...", related: ["d9"], assistants: ["Мария"] },
  { id: "d12", title: "Гарантия застройщика", category: "faq", type: "md", words: 260, updated: "неделю", tags: ["faq", "гарантия"], importance: 1, body: "5 лет на конструктив...", related: ["d4"], assistants: ["Алекс"] },
  { id: "d13", title: "Офис продаж", category: "contacts", type: "md", words: 120, updated: "месяц", tags: ["офис"], importance: 2, body: "г. Москва, ул. Ленина 1...", related: ["d14"], assistants: ["Алекс", "Мария"] },
  { id: "d14", title: "Телефоны и почта", category: "contacts", type: "md", words: 90, updated: "месяц", tags: ["контакты"], importance: 1, body: "+7 (495) 000-00-00...", related: ["d13"], assistants: ["Алекс", "Мария"] },
  { id: "d15", title: "Карьера", category: "contacts", type: "url", words: 0, updated: "месяц", tags: ["url"], importance: 1, body: "https://example.com/career", related: [], assistants: [] },
];

const ALL_TAGS = Array.from(new Set(MOCK_DOCS.flatMap((d) => d.tags)));

// ===== Page =================================================================

function KnowledgePage() {
  const [docs, setDocs] = useState<DocNode[]>(MOCK_DOCS);
  const [view, setView] = useState<"graph" | "list">("graph");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [openDocId, setOpenDocId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      if (activeCategory !== "all" && d.category !== activeCategory) return false;
      if (activeTag && !d.tags.includes(activeTag)) return false;
      if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [docs, activeCategory, activeTag, search]);

  const counts = useMemo(() => {
    const c: Record<Category, number> = { products: 0, pricing: 0, faq: 0, contacts: 0 };
    docs.forEach((d) => (c[d.category] += 1));
    return c;
  }, [docs]);

  const openDoc = docs.find((d) => d.id === openDocId) ?? null;

  const handleSaveDoc = (updated: DocNode) => {
    setDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    toast.success("Документ сохранён");
    setOpenDocId(null);
  };

  const handleDeleteDocs = (ids: string[]) => {
    setDocs((prev) => prev.filter((d) => !ids.includes(d.id)));
    setSelected(new Set());
    toast.success(`Удалено: ${ids.length}`);
  };

  return (
    <div className="flex h-[calc(100vh-0px)] bg-[#141414] text-white">
      {/* LEFT PANEL */}
      <aside className="w-[300px] border-r border-[#2a2a2a] bg-[#0f0f0f] flex flex-col">
        <div className="p-4 border-b border-[#2a2a2a]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск документов…"
              className="pl-9 bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-white/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm",
              activeCategory === "all" ? "bg-[#1a1a1a] text-white" : "text-white/70 hover:bg-[#1a1a1a]"
            )}
          >
            <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Все документы</span>
            <Badge variant="secondary" className="bg-[#2a2a2a] text-white/80 hover:bg-[#2a2a2a]">{docs.length}</Badge>
          </button>

          <div className="pt-3 pb-1 px-3 text-xs uppercase tracking-wider text-white/40">Категории</div>

          {(Object.keys(CATEGORY_META) as Category[]).map((cat) => {
            const meta = CATEGORY_META[cat];
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm",
                  active ? "bg-[#1a1a1a] text-white" : "text-white/70 hover:bg-[#1a1a1a]"
                )}
              >
                <span className="flex items-center gap-2">
                  <span style={{ color: meta.color }}>{meta.emoji}</span>
                  {meta.label}
                </span>
                <Badge variant="secondary" className="bg-[#2a2a2a] text-white/80 hover:bg-[#2a2a2a]">{counts[cat]}</Badge>
              </button>
            );
          })}

          <div className="pt-4 pb-2 px-3 text-xs uppercase tracking-wider text-white/40">Теги</div>
          <div className="px-2 flex flex-wrap gap-1.5">
            {ALL_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={cn(
                  "text-xs px-2 py-1 rounded-full border transition-colors",
                  activeTag === tag
                    ? "bg-[#a8ff57] text-black border-[#a8ff57]"
                    : "bg-[#1a1a1a] text-white/70 border-[#2a2a2a] hover:border-[#a8ff57]/40"
                )}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 border-t border-[#2a2a2a]">
          <Button
            onClick={() => setUploadOpen(true)}
            className="w-full bg-[#a8ff57] text-black hover:bg-[#a8ff57]/90"
          >
            <Plus className="h-4 w-4 mr-2" /> Добавить
          </Button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 relative overflow-hidden">
        <div className="absolute top-4 right-4 z-20 inline-flex rounded-md border border-[#2a2a2a] bg-[#1a1a1a] p-1">
          <button
            onClick={() => setView("graph")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded",
              view === "graph" ? "bg-[#2a2a2a] text-white" : "text-white/60 hover:text-white"
            )}
          >
            <Network className="h-4 w-4" /> Graph
          </button>
          <button
            onClick={() => setView("list")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded",
              view === "list" ? "bg-[#2a2a2a] text-white" : "text-white/60 hover:text-white"
            )}
          >
            <ListIcon className="h-4 w-4" /> List
          </button>
        </div>

        {view === "graph" ? (
          <GraphView
            docs={filtered}
            onNodeClick={(id) => setOpenDocId(id)}
          />
        ) : (
          <ListView
            docs={filtered}
            selected={selected}
            setSelected={setSelected}
            onOpen={(id) => setOpenDocId(id)}
            onDelete={(ids) => handleDeleteDocs(ids)}
          />
        )}
      </main>

      {/* EDITOR PANEL */}
      {openDoc && (
        <DocumentEditor
          doc={openDoc}
          allDocs={docs}
          onClose={() => setOpenDocId(null)}
          onSave={handleSaveDoc}
        />
      )}

      {/* UPLOAD MODAL */}
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}

// ===== Graph view ===========================================================

interface GraphPos {
  id: string;
  x: number;
  y: number;
  r: number;
  color: string;
  title: string;
  category: Category;
}

function GraphView({
  docs,
  onNodeClick,
}: {
  docs: DocNode[];
  onNodeClick: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState<string | null>(null);
  const [overlaySearch, setOverlaySearch] = useState("");

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setSize({ w: rect.width, h: rect.height });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Deterministic radial-ish layout grouped by category.
  const positions = useMemo<GraphPos[]>(() => {
    const cats = Array.from(new Set(docs.map((d) => d.category)));
    const cx = size.w / 2;
    const cy = size.h / 2;
    const ringR = Math.min(size.w, size.h) * 0.32;

    return docs.map((d, i) => {
      const catIdx = cats.indexOf(d.category);
      const inCat = docs.filter((x) => x.category === d.category);
      const subIdx = inCat.indexOf(d);
      const baseAngle = (catIdx / Math.max(1, cats.length)) * Math.PI * 2;
      const spread = (subIdx - (inCat.length - 1) / 2) * 0.35;
      const angle = baseAngle + spread;
      const radius = ringR + (i % 3) * 30;
      return {
        id: d.id,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        r: 8 + d.importance * 5,
        color: CATEGORY_META[d.category].color,
        title: d.title,
        category: d.category,
      };
    });
  }, [docs, size]);

  const posById = useMemo(() => {
    const m = new Map<string, GraphPos>();
    positions.forEach((p) => m.set(p.id, p));
    return m;
  }, [positions]);

  const edges = useMemo(() => {
    const out: Array<{ a: GraphPos; b: GraphPos }> = [];
    docs.forEach((d) => {
      d.related.forEach((rid) => {
        const a = posById.get(d.id);
        const b = posById.get(rid);
        if (a && b && d.id < rid) out.push({ a, b });
      });
    });
    return out;
  }, [docs, posById]);

  const matchedIds = useMemo(() => {
    if (!overlaySearch) return null;
    const q = overlaySearch.toLowerCase();
    return new Set(docs.filter((d) => d.title.toLowerCase().includes(q)).map((d) => d.id));
  }, [overlaySearch, docs]);

  return (
    <div ref={containerRef} className="absolute inset-0 bg-[#141414]">
      {/* Subtitle */}
      <div className="absolute top-4 left-4 z-10 max-w-md text-sm text-white/50">
        Это ваша база знаний. Каждый документ влияет на ответы ассистента.
      </div>

      {/* Search overlay */}
      <div className="absolute top-16 left-4 z-10 w-64">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            value={overlaySearch}
            onChange={(e) => setOverlaySearch(e.target.value)}
            placeholder="Найти узел…"
            className="pl-9 bg-[#1a1a1a]/90 backdrop-blur border-[#2a2a2a] text-white placeholder:text-white/40 h-9"
          />
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1 rounded-md border border-[#2a2a2a] bg-[#1a1a1a]/90 backdrop-blur p-1">
        <button
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
          className="p-2 rounded hover:bg-[#2a2a2a] text-white/80"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
          className="p-2 rounded hover:bg-[#2a2a2a] text-white/80"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="p-2 rounded hover:bg-[#2a2a2a] text-white/80"
          aria-label="Reset"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-wrap gap-3 rounded-md border border-[#2a2a2a] bg-[#1a1a1a]/90 backdrop-blur px-3 py-2 text-xs">
        {(Object.keys(CATEGORY_META) as Category[]).map((c) => (
          <span key={c} className="flex items-center gap-1.5 text-white/70">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORY_META[c].color }} />
            {CATEGORY_META[c].label}
          </span>
        ))}
      </div>

      <svg width={size.w} height={size.h} className="block">
        <g transform={`translate(${size.w / 2 + pan.x}, ${size.h / 2 + pan.y}) scale(${zoom}) translate(${-size.w / 2}, ${-size.h / 2})`}>
          {edges.map((e, i) => (
            <line
              key={i}
              x1={e.a.x}
              y1={e.a.y}
              x2={e.b.x}
              y2={e.b.y}
              stroke="#2a2a2a"
              strokeWidth={1}
            />
          ))}
          {positions.map((p) => {
            const dim = matchedIds && !matchedIds.has(p.id);
            const isHover = hover === p.id;
            return (
              <g
                key={p.id}
                onClick={() => onNodeClick(p.id)}
                onMouseEnter={() => setHover(p.id)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: "pointer", opacity: dim ? 0.2 : 1 }}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={p.r + (isHover ? 3 : 0)}
                  fill={p.color}
                  fillOpacity={isHover ? 1 : 0.85}
                  stroke={isHover ? "#fff" : "transparent"}
                  strokeWidth={1.5}
                />
                <text
                  x={p.x}
                  y={p.y + p.r + 12}
                  textAnchor="middle"
                  fontSize={10}
                  fill="rgba(255,255,255,0.7)"
                  pointerEvents="none"
                >
                  {p.title.length > 22 ? p.title.slice(0, 22) + "…" : p.title}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

// ===== List view ============================================================

function ListView({
  docs,
  selected,
  setSelected,
  onOpen,
  onDelete,
}: {
  docs: DocNode[];
  selected: Set<string>;
  setSelected: (s: Set<string>) => void;
  onOpen: (id: string) => void;
  onDelete: (ids: string[]) => void;
}) {
  const allChecked = docs.length > 0 && docs.every((d) => selected.has(d.id));
  const toggleAll = () => {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(docs.map((d) => d.id)));
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <div className="absolute inset-0 overflow-auto p-6 pt-16">
      {selected.size > 0 && (
        <div className="sticky top-0 z-10 mb-3 flex items-center justify-between rounded-md border border-[#a8ff57]/30 bg-[#1a1a1a] px-4 py-2">
          <span className="text-sm">Выбрано: {selected.size}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" className="text-white/80 hover:bg-[#2a2a2a]">Move</Button>
            <Button size="sm" variant="ghost" className="text-white/80 hover:bg-[#2a2a2a]">Tag</Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(Array.from(selected))}
              className="text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#141414] text-white/60">
            <tr>
              <th className="w-10 p-3"><Checkbox checked={allChecked} onCheckedChange={toggleAll} /></th>
              <th className="text-left p-3 font-medium">Название</th>
              <th className="text-left p-3 font-medium">Категория</th>
              <th className="text-left p-3 font-medium">Тип</th>
              <th className="text-left p-3 font-medium">Слов</th>
              <th className="text-left p-3 font-medium">Обновлено</th>
              <th className="w-32 p-3"></th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id} className="border-t border-[#2a2a2a] hover:bg-[#222]">
                <td className="p-3"><Checkbox checked={selected.has(d.id)} onCheckedChange={() => toggleOne(d.id)} /></td>
                <td className="p-3 cursor-pointer" onClick={() => onOpen(d.id)}>
                  <div className="font-medium">{d.title}</div>
                  <div className="flex gap-1 mt-0.5">
                    {d.tags.slice(0, 3).map((t) => (
                      <span key={t} className="text-[10px] text-white/50">#{t}</span>
                    ))}
                  </div>
                </td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1.5 text-white/70">
                    <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_META[d.category].color }} />
                    {CATEGORY_META[d.category].label}
                  </span>
                </td>
                <td className="p-3 text-white/60 uppercase text-xs">{d.type}</td>
                <td className="p-3 text-white/70">{d.words.toLocaleString("ru-RU")}</td>
                <td className="p-3 text-white/50">{d.updated}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => onOpen(d.id)} className="p-1.5 rounded hover:bg-[#2a2a2a] text-white/70" title="Edit"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => onOpen(d.id)} className="p-1.5 rounded hover:bg-[#2a2a2a] text-white/70" title="Preview"><Eye className="h-4 w-4" /></button>
                    <button onClick={() => onDelete([d.id])} className="p-1.5 rounded hover:bg-red-500/10 text-red-400" title="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {docs.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-white/40">Ничего не найдено</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===== Document editor ======================================================

function DocumentEditor({
  doc,
  allDocs,
  onClose,
  onSave,
}: {
  doc: DocNode;
  allDocs: DocNode[];
  onClose: () => void;
  onSave: (d: DocNode) => void;
}) {
  const [draft, setDraft] = useState<DocNode>(doc);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => setDraft(doc), [doc]);

  const related = draft.related
    .map((id) => allDocs.find((d) => d.id === id))
    .filter(Boolean) as DocNode[];

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || draft.tags.includes(t)) return;
    setDraft({ ...draft, tags: [...draft.tags, t] });
    setTagInput("");
  };

  const removeTag = (t: string) => setDraft({ ...draft, tags: draft.tags.filter((x) => x !== t) });

  const insert = (before: string, after = before) => {
    setDraft({ ...draft, body: draft.body + `\n${before}текст${after}` });
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="w-[520px] bg-[#0f0f0f] border-l border-[#2a2a2a] flex flex-col shadow-2xl animate-in slide-in-from-right">
        {/* Header */}
        <div className="p-4 border-b border-[#2a2a2a] flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-white/40 mb-1 flex items-center gap-1">
              <Folder className="h-3 w-3" />
              {CATEGORY_META[draft.category].label} <span className="text-white/30">/</span>{" "}
              <span className="text-white/60 truncate">{draft.title || "Без названия"}</span>
            </div>
            <Input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="bg-transparent border-0 text-xl font-semibold text-white px-0 focus-visible:ring-0 h-auto"
              placeholder="Название документа"
            />
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-[#2a2a2a] text-white/60">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-2 border-b border-[#2a2a2a] flex flex-wrap gap-1 text-white/70">
          <ToolBtn onClick={() => insert("**", "**")}><Bold className="h-4 w-4" /></ToolBtn>
          <ToolBtn onClick={() => insert("*", "*")}><Italic className="h-4 w-4" /></ToolBtn>
          <ToolBtn onClick={() => insert("[", "](url)")}><LinkIcon className="h-4 w-4" /></ToolBtn>
          <span className="w-px bg-[#2a2a2a] mx-1" />
          <ToolBtn onClick={() => insert("# ", "")}><Heading1 className="h-4 w-4" /></ToolBtn>
          <ToolBtn onClick={() => insert("## ", "")}><Heading2 className="h-4 w-4" /></ToolBtn>
          <ToolBtn onClick={() => insert("### ", "")}><Heading3 className="h-4 w-4" /></ToolBtn>
          <span className="w-px bg-[#2a2a2a] mx-1" />
          <ToolBtn onClick={() => insert("- ", "")}><ListBulletIcon className="h-4 w-4" /></ToolBtn>
          <ToolBtn onClick={() => insert("`", "`")}><Code className="h-4 w-4" /></ToolBtn>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <Textarea
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            className="min-h-[260px] bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-white/40 font-mono text-sm"
            placeholder="Markdown-содержимое…"
          />

          <div className="rounded-md border border-[#2a2a2a] bg-[#141414] p-3 text-sm text-white/70">
            <div className="text-xs uppercase tracking-wider text-white/40 mb-2">Превью</div>
            <pre className="whitespace-pre-wrap font-sans">{draft.body || "—"}</pre>
          </div>

          {/* Sidebar within panel */}
          <div className="space-y-4 pt-2">
            <div>
              <div className="text-xs uppercase tracking-wider text-white/40 mb-2">Теги</div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {draft.tags.map((t) => (
                  <span key={t} className="text-xs px-2 py-1 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] text-white/80 inline-flex items-center gap-1">
                    #{t}
                    <button onClick={() => removeTag(t)} className="text-white/40 hover:text-white">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
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
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-white/40 mb-2">Категория</div>
              <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v as Category })}>
                <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                  {(Object.keys(CATEGORY_META) as Category[]).map((c) => (
                    <SelectItem key={c} value={c}>{CATEGORY_META[c].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-white/40 mb-2">Связанные документы</div>
              {related.length === 0 ? (
                <div className="text-sm text-white/40">Нет связанных</div>
              ) : (
                <ul className="space-y-1">
                  {related.map((r) => (
                    <li key={r.id} className="text-sm text-white/80 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: CATEGORY_META[r.category].color }} />
                      {r.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-white/40 mb-2">Используется ассистентами</div>
              <div className="flex flex-wrap gap-1.5">
                {draft.assistants.length === 0 && <span className="text-sm text-white/40">—</span>}
                {draft.assistants.map((a) => (
                  <span key={a} className="text-xs px-2 py-1 rounded-full bg-[#a8ff57]/10 border border-[#a8ff57]/30 text-[#a8ff57]">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2a2a2a] flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} className="text-white/70 hover:bg-[#2a2a2a]">Отмена</Button>
          <Button onClick={() => onSave(draft)} className="bg-[#a8ff57] text-black hover:bg-[#a8ff57]/90">
            Сохранить
          </Button>
        </div>
      </div>
    </div>
  );
}

function ToolBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="p-2 rounded hover:bg-[#2a2a2a]">
      {children}
    </button>
  );
}

// ===== Upload modal =========================================================

function UploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [files, setFiles] = useState<Array<{ name: string; progress: number }>>([]);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list).map((f) => ({ name: f.name, progress: 0 }));
    setFiles((prev) => [...prev, ...next]);
    // Mock upload progress // TODO: replace with real API
    next.forEach((f, idx) => {
      const start = files.length + idx;
      const tick = () => {
        setFiles((prev) => {
          const copy = [...prev];
          if (!copy[start]) return prev;
          copy[start] = { ...copy[start], progress: Math.min(100, copy[start].progress + 10) };
          return copy;
        });
      };
      const id = setInterval(() => {
        tick();
      }, 150);
      setTimeout(() => clearInterval(id), 1700);
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#0f0f0f] border-[#2a2a2a] text-white max-w-xl">
        <DialogHeader>
          <DialogTitle>Добавить в базу знаний</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="file">
          <TabsList className="bg-[#1a1a1a] border border-[#2a2a2a]">
            <TabsTrigger value="file" className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white">Загрузить файл</TabsTrigger>
            <TabsTrigger value="url" className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white">URL</TabsTrigger>
            <TabsTrigger value="text" className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white">Текст</TabsTrigger>
            <TabsTrigger value="obsidian" className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white">Obsidian sync</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="mt-4 space-y-3">
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
              className="border-2 border-dashed border-[#2a2a2a] rounded-lg p-8 text-center cursor-pointer hover:border-[#a8ff57]/40 hover:bg-[#1a1a1a] transition"
            >
              <Upload className="h-8 w-8 mx-auto text-white/40 mb-2" />
              <div className="text-sm text-white/80">Перетащите файлы сюда или нажмите чтобы выбрать</div>
              <div className="text-xs text-white/40 mt-1">PDF, DOCX, MD, TXT — до 20MB</div>
              <input
                ref={inputRef}
                type="file"
                multiple
                hidden
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="rounded-md border border-[#2a2a2a] bg-[#1a1a1a] p-2">
                    <div className="flex justify-between text-xs text-white/70 mb-1">
                      <span className="truncate">{f.name}</span>
                      <span>{f.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-[#2a2a2a] rounded overflow-hidden">
                      <div className="h-full bg-[#a8ff57] transition-all" style={{ width: `${f.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="url" className="mt-4 space-y-3">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/page"
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
            />
            <div className="text-xs text-white/40">Мы загрузим страницу и извлечём текст для базы знаний.</div>
          </TabsContent>

          <TabsContent value="text" className="mt-4 space-y-3">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Вставьте текст…"
              className="min-h-[180px] bg-[#1a1a1a] border-[#2a2a2a] text-white"
            />
          </TabsContent>

          <TabsContent value="obsidian" className="mt-4">
            <div className="rounded-md border border-[#2a2a2a] bg-[#1a1a1a] p-4 text-sm text-white/70">
              Подключите ваш vault Obsidian для автоматической синхронизации заметок.
              <Button className="mt-3 bg-[#a8ff57] text-black hover:bg-[#a8ff57]/90">Подключить Obsidian</Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} className="text-white/70 hover:bg-[#2a2a2a]">Отмена</Button>
          <Button
            onClick={() => { toast.success("Добавлено в базу знаний"); onClose(); }}
            className="bg-[#a8ff57] text-black hover:bg-[#a8ff57]/90"
          >
            Добавить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
