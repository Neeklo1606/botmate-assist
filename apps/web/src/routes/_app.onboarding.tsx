/**
 * /onboarding — 4-шаговый wizard после регистрации.
 *
 * Шаги:
 *   1. Создайте ассистента (имя, задача, тон)
 *   2. Добавьте знания (файлы / URL / текст)
 *   3. Установите виджет (snippet + платформы)
 *   4. Проверьте чат (мини-чат с фейковым стримингом)
 *
 * Все данные — mock (TODO: заменить на real API при подключении бэка).
 * Стиль — dark Botmate: #0a0a0a фон, карточки #141414, бордер #2a2a2a,
 * лаймовый акцент #a8ff57.
 */
import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { qk } from "@/lib/query-keys";
import { useOpenAiIntegrationStatus } from "@/lib/hooks/use-workspace-saas";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  Copy,
  FileText,
  Link as LinkIcon,
  Loader2,
  Send,
  Sparkles,
  Type as TypeIcon,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_app/onboarding")({
  head: () => ({
    meta: [{ title: "Онбординг — botme" }],
  }),
  component: OnboardingWizard,
});

const TOTAL_STEPS = 4;
const STEP_TITLES = [
  "Создайте ассистента",
  "Добавьте знания",
  "Установите виджет",
  "Проверьте чат",
];

/* ───────────── Wizard state ───────────── */

type Tone = "professional" | "friendly" | "neutral";

interface KnowledgeChip {
  id: string;
  kind: "file" | "url" | "text";
  label: string;
}

interface WizardState {
  // Step 1
  assistantName: string;
  assistantTask: string;
  tone: Tone;
  // Step 2
  knowledge: KnowledgeChip[];
  // Step 3
  widgetInstalled: boolean;
}

const INITIAL_STATE: WizardState = {
  assistantName: "",
  assistantTask: "",
  tone: "friendly",
  knowledge: [],
  widgetInstalled: false,
};

/* ───────────── Wizard shell ───────────── */

function OnboardingWizard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof WizardState>(key: K, value: WizardState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const canGoNext = (() => {
    if (step === 1) return state.assistantName.trim().length > 0;
    if (step === 3) return state.widgetInstalled;
    return true;
  })();

  const goNext = () => {
    if (step === 1) {
      void persistAssistantAndAdvance();
      return;
    }
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
    else void finish();
  };

  const persistAssistantAndAdvance = async () => {
    if (!state.assistantName.trim()) return;
    setSaving(true);
    try {
      const created = await apiClient.createAssistant({
        name: state.assistantName.trim(),
        niche: "other",
      });
      if (state.assistantTask.trim()) {
        await apiClient.patchAssistant(created.id, {
          settings: { task: state.assistantTask.trim(), tone: state.tone },
        });
      }
      setAssistantId(created.id);
      await qc.invalidateQueries({ queryKey: qk.assistants.root });
      setStep(2);
      toast.success("Ассистент создан");
    } catch {
      toast.error("Не удалось создать ассистента");
    } finally {
      setSaving(false);
    }
  };
  const goPrev = () => step > 1 && setStep((s) => s - 1);

  const finish = async () => {
    toast.success("Онбординг завершён");
    navigate({ to: assistantId ? "/assistants" : "/app" });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "#0a0a0a", color: "#ffffff" }}
    >
      {/* Top bar: progress + skip */}
      <header className="flex flex-col gap-3 px-5 pt-5 md:px-10 md:pt-6">
        <div className="toolbar-row">
          <span
            className="font-display text-sm font-medium tabular-nums"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            Шаг {step} из {TOTAL_STEPS}
          </span>
          <Link
            to="/app"
            className="text-sm font-medium transition-colors hover:text-white"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            Пропустить →
          </Link>
        </div>
        <ProgressBar current={step} total={TOTAL_STEPS} />
      </header>

      {/* Card */}
      <main className="flex flex-1 items-start justify-center overflow-y-auto px-4 py-8 md:items-center md:py-12">
        <div
          className="w-full max-w-[560px] rounded-2xl p-6 md:p-8"
          style={{ background: "#141414", border: "1px solid #2a2a2a" }}
        >
          <StepHeader step={step} />

          <div className="mt-6">
            {step === 1 && <Step1Assistant state={state} update={update} />}
            {step === 2 && <Step2Knowledge state={state} update={update} />}
            {step === 3 && <Step3Widget state={state} update={update} />}
            {step === 4 && (
              <Step4Chat
                assistantName={state.assistantName || "Ассистент"}
                assistantId={assistantId}
              />
            )}
          </div>

          {/* Nav */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={goPrev}
              disabled={step === 1}
              className="inline-flex h-10 items-center gap-1.5 rounded-md px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                color: "rgba(255,255,255,0.85)",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid #2a2a2a",
              }}
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
              Назад
            </button>

            <button
              type="button"
              onClick={goNext}
              disabled={!canGoNext || saving}
              className="inline-flex h-10 items-center gap-1.5 rounded-md px-5 text-sm font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: "#a8ff57", color: "#0a0a0a" }}
            >
              {saving ?
                "Сохранение…"
              : step === TOTAL_STEPS ?
                "Открыть дашборд"
              : "Далее"}
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ───────────── Building blocks ───────────── */

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${total}, 1fr)` }}
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Шаг ${current} из ${total}`}
    >
      {Array.from({ length: total }).map((_, i) => {
        const idx = i + 1;
        const filled = idx <= current;
        return (
          <span
            key={i}
            className="h-1.5 rounded-full transition-colors"
            style={{ background: filled ? "#a8ff57" : "rgba(255,255,255,0.08)" }}
          />
        );
      })}
    </div>
  );
}

function StepHeader({ step }: { step: number }) {
  const icons = [Sparkles, FileText, Copy, Bot];
  const Icon = icons[step - 1];
  const subtitles = [
    "Дайте ассистенту имя и опишите его задачу",
    "Загрузите материалы — ассистент будет отвечать по ним",
    "Подключите виджет на ваш сайт за 1 минуту",
    "Проверьте, как ассистент общается с клиентами",
  ];
  return (
    <div className="flex items-start gap-3">
      <span
        className="flex h-10 w-10 flex-none items-center justify-center rounded-lg"
        style={{ background: "rgba(168,255,87,0.12)", color: "#a8ff57" }}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div>
        <h1 className="font-display text-xl font-semibold text-white md:text-2xl">
          {STEP_TITLES[step - 1]}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
          {subtitles[step - 1]}
        </p>
      </div>
    </div>
  );
}

/* ───────────── Step 1 — Assistant ───────────── */

function Step1Assistant({
  state,
  update,
}: {
  state: WizardState;
  update: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void;
}) {
  const tones: { id: Tone; label: string }[] = [
    { id: "professional", label: "Профессиональный" },
    { id: "friendly", label: "Дружелюбный" },
    { id: "neutral", label: "Нейтральный" },
  ];
  return (
    <div className="space-y-5">
      <Field label="Имя ассистента" required>
        <Input
          autoFocus
          value={state.assistantName}
          onChange={(e) => update("assistantName", e.target.value)}
          placeholder="Например: Алекс"
          className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-white/20"
        />
      </Field>

      <Field label="Задача ассистента">
        <Textarea
          value={state.assistantTask}
          onChange={(e) => update("assistantTask", e.target.value)}
          placeholder="Помогает клиентам выбрать квартиру, отвечает на вопросы о ценах…"
          rows={4}
          className="resize-none border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-white/20"
        />
      </Field>

      <Field label="Тон общения">
        <div className="grid grid-cols-3 gap-2">
          {tones.map((t) => {
            const active = state.tone === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => update("tone", t.id)}
                className="rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
                style={{
                  background: active ? "rgba(168,255,87,0.12)" : "rgba(255,255,255,0.04)",
                  color: active ? "#a8ff57" : "rgba(255,255,255,0.85)",
                  border: `1px solid ${active ? "rgba(168,255,87,0.4)" : "#2a2a2a"}`,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </Field>
    </div>
  );
}

/* ───────────── Step 2 — Knowledge ───────────── */

function Step2Knowledge({
  state,
  update,
}: {
  state: WizardState;
  update: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void;
}) {
  const [tab, setTab] = useState<"files" | "url" | "text">("files");
  const [urlValue, setUrlValue] = useState("");
  const [textValue, setTextValue] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addChip = (chip: KnowledgeChip) =>
    update("knowledge", [...state.knowledge, chip]);

  const removeChip = (id: string) =>
    update("knowledge", state.knowledge.filter((c) => c.id !== id));

  // TODO: replace with real API — POST /api/knowledge/upload
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((f) =>
      addChip({ id: `f_${Date.now()}_${f.name}`, kind: "file", label: f.name }),
    );
  };

  const handleAddUrl = (e: FormEvent) => {
    e.preventDefault();
    const v = urlValue.trim();
    if (!v) return;
    // TODO: replace with real API — POST /api/knowledge/url
    addChip({ id: `u_${Date.now()}`, kind: "url", label: v });
    setUrlValue("");
  };

  const handleAddText = () => {
    const v = textValue.trim();
    if (!v) return;
    // TODO: replace with real API — POST /api/knowledge/text
    const preview = v.length > 40 ? `${v.slice(0, 40)}…` : v;
    addChip({ id: `t_${Date.now()}`, kind: "text", label: preview });
    setTextValue("");
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div
        className="grid grid-cols-3 gap-1 rounded-md p-1"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid #2a2a2a" }}
      >
        {[
          { id: "files" as const, label: "Файлы", icon: Upload },
          { id: "url" as const, label: "URL", icon: LinkIcon },
          { id: "text" as const, label: "Текст", icon: TypeIcon },
        ].map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="inline-flex items-center justify-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors"
              style={{
                background: active ? "#a8ff57" : "transparent",
                color: active ? "#0a0a0a" : "rgba(255,255,255,0.7)",
              }}
            >
              <t.icon className="h-3.5 w-3.5" strokeWidth={2} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === "files" && (
        <div
          onDragOver={(e: DragEvent) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e: DragEvent) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg px-6 py-10 text-center transition-colors"
          style={{
            border: `2px dashed ${dragOver ? "#a8ff57" : "#2a2a2a"}`,
            background: dragOver ? "rgba(168,255,87,0.05)" : "rgba(255,255,255,0.02)",
          }}
        >
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: "rgba(168,255,87,0.12)", color: "#a8ff57" }}
          >
            <Upload className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <p className="text-sm font-medium text-white">
            Перетащите файлы или нажмите
          </p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            PDF, DOCX, TXT — до 20 МБ
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      )}

      {tab === "url" && (
        <form onSubmit={handleAddUrl} className="flex gap-2">
          <Input
            type="url"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="https://example.com/faq"
            className="h-11 flex-1 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-white/20"
          />
          <button
            type="submit"
            className="inline-flex h-11 items-center rounded-md px-4 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: "#a8ff57", color: "#0a0a0a" }}
          >
            Добавить
          </button>
        </form>
      )}

      {tab === "text" && (
        <div className="space-y-2">
          <Textarea
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            placeholder="Вставьте сюда любую информацию: прайс, описание услуг, FAQ…"
            rows={5}
            className="resize-none border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-white/20"
          />
          <button
            type="button"
            onClick={handleAddText}
            disabled={!textValue.trim()}
            className="inline-flex h-9 items-center rounded-md px-4 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: "#a8ff57", color: "#0a0a0a" }}
          >
            Сохранить текст
          </button>
        </div>
      )}

      {/* Chips */}
      {state.knowledge.length > 0 && (
        <div className="space-y-2 pt-2">
          <div
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Добавлено · {state.knowledge.length}
          </div>
          <ul className="flex flex-wrap gap-2">
            {state.knowledge.map((c) => (
              <li
                key={c.id}
                className="inline-flex items-center gap-2 rounded-full py-1 pl-3 pr-1.5 text-xs"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid #2a2a2a" }}
              >
                <ChipIcon kind={c.kind} />
                <span className="max-w-[220px] truncate text-white">{c.label}</span>
                <button
                  type="button"
                  onClick={() => removeChip(c.id)}
                  className="flex h-5 w-5 items-center justify-center rounded-full transition-colors hover:bg-white/10"
                  aria-label={`Удалить ${c.label}`}
                >
                  <X className="h-3 w-3" style={{ color: "rgba(255,255,255,0.6)" }} strokeWidth={2} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
        Этот шаг можно пропустить — материалы добавите потом из кабинета.
      </p>
    </div>
  );
}

function ChipIcon({ kind }: { kind: KnowledgeChip["kind"] }) {
  const Icon = kind === "file" ? FileText : kind === "url" ? LinkIcon : TypeIcon;
  return (
    <Icon className="h-3.5 w-3.5" style={{ color: "#a8ff57" }} strokeWidth={1.75} />
  );
}

/* ───────────── Step 3 — Widget ───────────── */

const WIDGET_SNIPPET = `<script src="https://cdn.botme.io/w.js" data-key="demo-key-12345" async></script>`;

const PLATFORM_HINTS: Record<string, string> = {
  WordPress:
    "Откройте «Внешний вид → Редактор тем», выберите footer.php и вставьте код перед </body>. Или используйте плагин Insert Headers and Footers.",
  Tilda:
    "Настройки сайта → Ещё → HTML-код для вставки внутри HEAD/BODY → вставьте сниппет в раздел «Перед </body>».",
  "Любой сайт":
    "Откройте HTML вашего сайта и вставьте этот сниппет одной строкой прямо перед закрывающим тегом </body>.",
};

function Step3Widget({
  state,
  update,
}: {
  state: WizardState;
  update: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void;
}) {
  const [platform, setPlatform] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(WIDGET_SNIPPET);
      setCopied(true);
      toast.success("Сниппет скопирован");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Не удалось скопировать");
    }
  };

  return (
    <div className="space-y-4">
      {/* Code block */}
      <div
        className="relative overflow-hidden rounded-lg"
        style={{ background: "#0a0a0a", border: "1px solid #2a2a2a" }}
      >
        <button
          type="button"
          onClick={copy}
          className="absolute right-2 top-2 inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors"
          style={{
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.85)",
            border: "1px solid #2a2a2a",
          }}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" style={{ color: "#a8ff57" }} strokeWidth={2.5} />
              Скопировано
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
              Копировать
            </>
          )}
        </button>
        <pre
          className="overflow-x-auto px-4 py-4 pr-28 font-mono text-[12px] leading-relaxed"
          style={{ color: "#a8ff57" }}
        >
          <code>{WIDGET_SNIPPET}</code>
        </pre>
      </div>

      <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
        Вставьте этот код перед{" "}
        <code
          className="rounded px-1.5 py-0.5 font-mono text-[12px]"
          style={{ background: "rgba(168,255,87,0.1)", color: "#a8ff57" }}
        >
          {"</body>"}
        </code>{" "}
        на вашем сайте.
      </p>

      {/* Platforms */}
      <div className="space-y-2">
        <div
          className="text-xs font-medium uppercase tracking-wide"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          Инструкции для платформы
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Object.keys(PLATFORM_HINTS).map((p) => {
            const active = platform === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPlatform(active ? null : p)}
                className="rounded-md px-3 py-2 text-sm font-medium transition-colors"
                style={{
                  background: active ? "rgba(168,255,87,0.12)" : "rgba(255,255,255,0.04)",
                  color: active ? "#a8ff57" : "rgba(255,255,255,0.85)",
                  border: `1px solid ${active ? "rgba(168,255,87,0.4)" : "#2a2a2a"}`,
                }}
              >
                {p}
              </button>
            );
          })}
        </div>
        {platform && (
          <p
            className="rounded-md px-3 py-2.5 text-sm leading-relaxed"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid #2a2a2a",
              color: "rgba(255,255,255,0.8)",
            }}
          >
            {PLATFORM_HINTS[platform]}
          </p>
        )}
      </div>

      {/* Confirm checkbox */}
      <label
        className="flex cursor-pointer items-start gap-3 rounded-lg px-4 py-3 transition-colors"
        style={{
          background: state.widgetInstalled
            ? "rgba(168,255,87,0.06)"
            : "rgba(255,255,255,0.03)",
          border: `1px solid ${state.widgetInstalled ? "rgba(168,255,87,0.35)" : "#2a2a2a"}`,
        }}
      >
        <input
          type="checkbox"
          checked={state.widgetInstalled}
          onChange={(e) => update("widgetInstalled", e.target.checked)}
          className="sr-only"
        />
        <span
          aria-hidden
          className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded transition-colors"
          style={{
            background: state.widgetInstalled ? "#a8ff57" : "transparent",
            border: `1.5px solid ${state.widgetInstalled ? "#a8ff57" : "rgba(255,255,255,0.3)"}`,
          }}
        >
          {state.widgetInstalled && (
            <Check className="h-3 w-3" style={{ color: "#0a0a0a" }} strokeWidth={3} />
          )}
        </span>
        <span className="text-sm font-medium text-white">Я уже установил виджет на сайт</span>
      </label>
    </div>
  );
}

/* ───────────── Step 4 — Chat preview ───────────── */

interface ChatMsg {
  id: string;
  role: "bot" | "user";
  text: string;
  streaming?: boolean;
}

function Step4Chat({ assistantName, assistantId }: { assistantName: string; assistantId: string | null }) {
  const openAi = useOpenAiIntegrationStatus();
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "welcome",
      role: "bot",
      text: `Привет! Я ваш новый ассистент. Попробуйте написать мне что-нибудь.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isThinking]);

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isThinking) return;

    const userMsg: ChatMsg = { id: `u_${Date.now()}`, role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsThinking(true);

    if (!openAi.data?.configured) {
      setIsThinking(false);
      setMessages((m) => [
        ...m,
        {
          id: `blocked_${Date.now()}`,
          role: "bot",
          text:
            "Подключите OpenAI API ключ в разделе «Интеграции». Без ключа ассистент не отвечает.",
        },
      ]);
      return;
    }

    if (!assistantId) {
      setIsThinking(false);
      toast.error("Сначала создайте ассистента на шаге 1");
      return;
    }

    void (async () => {
      try {
        const session = await apiClient.createChatSession({ assistantId, title: "Проверка онбординга" });
        const res = await apiClient.appendChatAuto(session.id, text);
        const assistantMsg = res.messages.find((m) => m.role === "ASSISTANT");
        setMessages((m) => [
          ...m,
          {
            id: assistantMsg?.id ?? `b_${Date.now()}`,
            role: "bot",
            text: assistantMsg?.content ?? "Ответ получен.",
          },
        ]);
      } catch {
        setMessages((m) => [
          ...m,
          {
            id: `err_${Date.now()}`,
            role: "bot",
            text: "Не удалось получить ответ. Проверьте ключ OpenAI.",
          },
        ]);
      } finally {
        setIsThinking(false);
      }
    })();
  };

  return (
    <div
      className="flex h-[420px] flex-col overflow-hidden rounded-xl"
      style={{ background: "#0a0a0a", border: "1px solid #2a2a2a" }}
    >
      {/* Chat header */}
      <div
        className="flex items-center gap-2.5 px-4 py-3"
        style={{ borderBottom: "1px solid #2a2a2a" }}
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ background: "#a8ff57", color: "#0a0a0a" }}
        >
          <Bot className="h-4 w-4" strokeWidth={2} />
        </span>
        <div>
          <div className="text-sm font-semibold text-white">{assistantName}</div>
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>
            <span className="inline-flex h-1.5 w-1.5 rounded-full" style={{ background: "#a8ff57" }} />
            онлайн
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <ChatBubble key={m.id} msg={m} />
        ))}
        {isThinking && <TypingDots />}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 px-3 py-3"
        style={{ borderTop: "1px solid #2a2a2a" }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Напишите сообщение…"
          className="h-10 flex-1 rounded-md border-0 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:ring-1 focus:ring-white/20"
        />
        <button
          type="submit"
          disabled={!input.trim() || isThinking}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md transition-opacity disabled:opacity-40"
          style={{ background: "#a8ff57", color: "#0a0a0a" }}
          aria-label="Отправить"
        >
          {isThinking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" strokeWidth={2} />
          )}
        </button>
      </form>
    </div>
  );
}

function ChatBubble({ msg }: { msg: ChatMsg }) {
  const isBot = msg.role === "bot";
  return (
    <div className={`flex ${isBot ? "justify-start" : "justify-end"}`}>
      <div
        className="max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed"
        style={{
          background: isBot ? "rgba(255,255,255,0.06)" : "#a8ff57",
          color: isBot ? "#ffffff" : "#0a0a0a",
          borderTopLeftRadius: isBot ? 4 : 16,
          borderTopRightRadius: isBot ? 16 : 4,
        }}
      >
        {msg.text}
        {msg.streaming && (
          <span
            aria-hidden
            className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse align-middle"
            style={{ background: "#a8ff57" }}
          />
        )}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex justify-start">
      <div
        className="inline-flex items-center gap-1 rounded-2xl px-3 py-2.5"
        style={{
          background: "rgba(255,255,255,0.06)",
          borderTopLeftRadius: 4,
        }}
      >
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="h-1.5 w-1.5 animate-bounce rounded-full"
            style={{ background: "rgba(255,255,255,0.6)", animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ───────────── Tiny helpers ───────────── */

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="mb-1.5 block text-xs font-medium"
        style={{ color: "rgba(255,255,255,0.7)" }}
      >
        {label}
        {required && <span style={{ color: "#a8ff57" }}> *</span>}
      </label>
      {children}
    </div>
  );
}
