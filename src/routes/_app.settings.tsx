/**
 * /app/settings — tabbed settings page (Профиль / Тариф / Команда / Виджет).
 *
 * All actions are mocked. // TODO: replace with real API
 */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  Camera, Check, Trash2, Plus, X, Copy, MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="min-h-full bg-[#141414] text-white">
      <div className="px-6 py-5 border-b border-[#2a2a2a]">
        <h1 className="text-2xl font-semibold">Настройки</h1>
      </div>

      <Tabs defaultValue="profile" className="px-6 py-6">
        <TabsList className="bg-[#1a1a1a] border border-[#2a2a2a] mb-6">
          <TabsTrigger value="profile"  className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white">Профиль</TabsTrigger>
          <TabsTrigger value="billing"  className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white">Тариф</TabsTrigger>
          <TabsTrigger value="team"     className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white">Команда</TabsTrigger>
          <TabsTrigger value="widget"   className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white">Виджет</TabsTrigger>
        </TabsList>

        <TabsContent value="profile"><ProfileTab /></TabsContent>
        <TabsContent value="billing"><BillingTab /></TabsContent>
        <TabsContent value="team"><TeamTab /></TabsContent>
        <TabsContent value="widget"><WidgetTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ===== Profile ==============================================================

function ProfileTab() {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [name, setName]   = useState("Иван Петров");
  const [email, setEmail] = useState("ivan@example.com");
  const [phone, setPhone] = useState("+7 (916) 000-00-00");
  const [pwd, setPwd]     = useState({ cur: "", n1: "", n2: "" });
  const [lang, setLang]   = useState("ru");
  const [tz, setTz]       = useState("Europe/Moscow");
  const fileRef = useRef<HTMLInputElement>(null);

  const onPickAvatar = (f: File | null) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(f);
  };

  return (
    <Card>
      <div className="flex items-center gap-5 mb-6">
        <button
          onClick={() => fileRef.current?.click()}
          className="relative h-20 w-20 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] overflow-hidden flex items-center justify-center text-white/40 hover:text-white"
        >
          {avatar ? (
            <img src={avatar} alt="avatar" className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl font-semibold text-black bg-[#a8ff57] h-full w-full flex items-center justify-center">
              {name.slice(0, 1)}
            </span>
          )}
          <span className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition">
            <Camera className="h-5 w-5 text-white" />
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onPickAvatar(e.target.files?.[0] ?? null)} />
        <div>
          <div className="text-base font-medium">Фото профиля</div>
          <div className="text-xs text-white/50">JPG или PNG, до 5 MB</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Field label="Имя"><DarkInput value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Email"><DarkInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Телефон"><DarkInput value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
      </div>

      <SectionTitle>Сменить пароль</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Field label="Текущий пароль"><DarkInput type="password" value={pwd.cur} onChange={(e) => setPwd({ ...pwd, cur: e.target.value })} /></Field>
        <Field label="Новый пароль"><DarkInput type="password" value={pwd.n1} onChange={(e) => setPwd({ ...pwd, n1: e.target.value })} /></Field>
        <Field label="Повторите"><DarkInput type="password" value={pwd.n2} onChange={(e) => setPwd({ ...pwd, n2: e.target.value })} /></Field>
      </div>

      <SectionTitle>Локализация</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Field label="Язык интерфейса">
          <DarkSelect value={lang} onValueChange={setLang} options={[
            { value: "ru", label: "🇷🇺 Русский" },
            { value: "en", label: "🇬🇧 English" },
          ]} />
        </Field>
        <Field label="Часовой пояс">
          <DarkSelect value={tz} onValueChange={setTz} options={[
            { value: "Europe/Moscow", label: "(GMT+3) Москва" },
            { value: "Europe/Kaliningrad", label: "(GMT+2) Калининград" },
            { value: "Asia/Yekaterinburg", label: "(GMT+5) Екатеринбург" },
            { value: "Asia/Novosibirsk", label: "(GMT+7) Новосибирск" },
            { value: "Asia/Vladivostok", label: "(GMT+10) Владивосток" },
            { value: "Europe/London", label: "(GMT+0) London" },
            { value: "America/New_York", label: "(GMT-5) New York" },
          ]} />
        </Field>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => toast.success("Профиль сохранён")} className="bg-[#a8ff57] text-black hover:bg-[#a8ff57]/90">
          Сохранить
        </Button>
      </div>
    </Card>
  );
}

// ===== Billing ==============================================================

const PLANS = [
  { id: "free",     name: "Free",     price: "0",     dialogs: "100",   video: "0",    tracking: false, crm: false, api: false },
  { id: "start",    name: "Start",    price: "990",   dialogs: "500",   video: "60",   tracking: true,  crm: false, api: false },
  { id: "business", name: "Business", price: "2 490", dialogs: "2 000", video: "600",  tracking: true,  crm: true,  api: false },
  { id: "pro",      name: "Pro",      price: "6 990", dialogs: "10 000", video: "3 000", tracking: true, crm: true,  api: true },
] as const;

function BillingTab() {
  const current = "business";
  const usage = [
    { label: "Диалоги",      value: 847, max: 2000, unit: "" },
    { label: "Видео минуты", value: 234, max: 600,  unit: " мин" },
    { label: "Хранилище",    value: 1.2, max: 5,    unit: " ГБ" },
  ];

  return (
    <div className="space-y-6">
      {/* Current plan */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-xs uppercase tracking-wider text-white/40">Текущий тариф</div>
            <div className="text-2xl font-semibold mt-1">
              Business · <span className="text-[#a8ff57]">2 490 ₽</span>
              <span className="text-base text-white/50">/мес</span>
            </div>
          </div>
          <Button onClick={() => toast.success("Откроется страница оплаты (mock)")} className="bg-[#a8ff57] text-black hover:bg-[#a8ff57]/90">
            Повысить тариф
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {usage.map((u) => {
            const pct = Math.min(100, (u.value / u.max) * 100);
            const danger = pct > 80;
            return (
              <div key={u.label} className="rounded-md border border-[#2a2a2a] bg-[#141414] p-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-white/70">{u.label}</span>
                  <span className="text-white">{u.value}{u.unit} / {u.max}{u.unit}</span>
                </div>
                <div className="h-2 rounded bg-[#2a2a2a] overflow-hidden">
                  <div
                    className={cn("h-full transition-all", danger ? "bg-[#facc15]" : "bg-[#a8ff57]")}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Plan comparison */}
      <Card>
        <SectionTitle>Сравнение тарифов</SectionTitle>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead className="text-white/50">
              <tr>
                <th className="text-left p-3 font-medium">Тариф</th>
                <th className="text-left p-3 font-medium">Диалоги</th>
                <th className="text-left p-3 font-medium">Видео мин</th>
                <th className="text-left p-3 font-medium">Трекинг</th>
                <th className="text-left p-3 font-medium">CRM</th>
                <th className="text-left p-3 font-medium">API</th>
                <th className="text-left p-3 font-medium">Цена</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {PLANS.map((p) => {
                const isCurrent = p.id === current;
                return (
                  <tr key={p.id} className={cn(
                    "border-t border-[#2a2a2a]",
                    isCurrent && "bg-[#a8ff57]/5"
                  )}>
                    <td className="p-3 font-medium">
                      {p.name}
                      {isCurrent && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-[#a8ff57]/20 text-[#a8ff57] border border-[#a8ff57]/30">
                          текущий
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-white/80">{p.dialogs}</td>
                    <td className="p-3 text-white/80">{p.video || "—"}</td>
                    <td className="p-3">{p.tracking ? <Check className="h-4 w-4 text-[#a8ff57]" /> : <X className="h-4 w-4 text-white/30" />}</td>
                    <td className="p-3">{p.crm ? <Check className="h-4 w-4 text-[#a8ff57]" /> : <X className="h-4 w-4 text-white/30" />}</td>
                    <td className="p-3">{p.api ? <Check className="h-4 w-4 text-[#a8ff57]" /> : <X className="h-4 w-4 text-white/30" />}</td>
                    <td className="p-3 text-white">{p.price} ₽</td>
                    <td className="p-3 text-right">
                      {!isCurrent && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toast.success(`Переход на ${p.name} (mock)`)}
                          className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#2a2a2a]"
                        >
                          Выбрать
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ===== Team =================================================================

interface Member { id: string; name: string; email: string; role: "owner" | "admin" | "operator"; avatar: string; }

const ROLE_META: Record<Member["role"], { label: string; color: string; bg: string }> = {
  owner:    { label: "Владелец", color: "#a8ff57", bg: "#a8ff5710" },
  admin:    { label: "Админ",    color: "#57c7ff", bg: "#57c7ff10" },
  operator: { label: "Оператор", color: "#facc15", bg: "#facc1510" },
};

const INITIAL_TEAM: Member[] = [
  { id: "u1", name: "Иван Петров",  email: "ivan@example.com",  role: "owner",    avatar: "И" },
  { id: "u2", name: "Мария Кузьмина", email: "maria@example.com", role: "admin",    avatar: "М" },
  { id: "u3", name: "Анна Соколова", email: "anna@example.com",  role: "operator", avatar: "А" },
];

function TeamTab() {
  const [members, setMembers] = useState<Member[]>(INITIAL_TEAM);
  const [open, setOpen] = useState(false);
  const [invite, setInvite] = useState<{ email: string; role: Member["role"] }>({ email: "", role: "operator" });

  const sendInvite = () => {
    if (!invite.email.trim()) return;
    setMembers((m) => [...m, {
      id: `u${Date.now()}`,
      name: invite.email.split("@")[0],
      email: invite.email,
      role: invite.role,
      avatar: invite.email.slice(0, 1).toUpperCase(),
    }]);
    setInvite({ email: "", role: "operator" });
    setOpen(false);
    toast.success("Приглашение отправлено");
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-5">
        <SectionTitle className="mb-0">Участники</SectionTitle>
        <Button onClick={() => setOpen(true)} className="bg-[#a8ff57] text-black hover:bg-[#a8ff57]/90">
          <Plus className="h-4 w-4 mr-1.5" /> Пригласить участника
        </Button>
      </div>

      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 rounded-md border border-[#2a2a2a] bg-[#141414] p-3">
            <div className="h-10 w-10 rounded-full bg-[#a8ff57] text-black font-semibold flex items-center justify-center">
              {m.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{m.name}</div>
              <div className="text-xs text-white/50 truncate">{m.email}</div>
            </div>
            <span
              className="text-xs px-2 py-0.5 rounded-full border"
              style={{ background: ROLE_META[m.role].bg, color: ROLE_META[m.role].color, borderColor: ROLE_META[m.role].color + "40" }}
            >
              {ROLE_META[m.role].label}
            </span>
            {m.role !== "owner" && (
              <button
                onClick={() => { setMembers((arr) => arr.filter((x) => x.id !== m.id)); toast("Участник удалён"); }}
                className="p-2 rounded hover:bg-red-500/10 text-white/60 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0f0f0f] border-[#2a2a2a] text-white">
          <DialogHeader><DialogTitle>Пригласить участника</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <Field label="Email">
              <DarkInput
                type="email"
                value={invite.email}
                onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                placeholder="user@example.com"
              />
            </Field>
            <Field label="Роль">
              <DarkSelect
                value={invite.role}
                onValueChange={(v) => setInvite({ ...invite, role: v as Member["role"] })}
                options={[
                  { value: "admin",    label: "Админ" },
                  { value: "operator", label: "Оператор" },
                ]}
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} className="text-white/70 hover:bg-[#2a2a2a]">Отмена</Button>
            <Button onClick={sendInvite} className="bg-[#a8ff57] text-black hover:bg-[#a8ff57]/90">Отправить</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ===== Widget ===============================================================

const POSITIONS = [
  { id: "br", label: "Bottom Right",  cls: "bottom-3 right-3" },
  { id: "bl", label: "Bottom Left",   cls: "bottom-3 left-3" },
  { id: "bc", label: "Bottom Center", cls: "bottom-3 left-1/2 -translate-x-1/2" },
] as const;

function WidgetTab() {
  const [color, setColor] = useState("#a8ff57");
  const [position, setPosition] = useState<typeof POSITIONS[number]["id"]>("br");
  const [title, setTitle] = useState("Botmate");
  const [greeting, setGreeting] = useState("Здравствуйте! Чем могу помочь?");
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const snippet = useMemo(() => `<script src="https://cdn.botmate.ai/widget.js"
  data-key="bm_pub_xxxxxxxxxxxxx"
  data-color="${color}"
  data-position="${position}"
  data-title="${title}">
</script>`, [color, position, title]);

  const pos = POSITIONS.find((p) => p.id === position)!;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <SectionTitle>Внешний вид</SectionTitle>

        <Field label="Основной цвет">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-14 rounded border border-[#2a2a2a] bg-transparent cursor-pointer"
            />
            <DarkInput value={color} onChange={(e) => setColor(e.target.value)} className="flex-1" />
          </div>
        </Field>

        <Field label="Положение на странице">
          <div className="grid grid-cols-3 gap-2">
            {POSITIONS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPosition(p.id)}
                className={cn(
                  "rounded-md border px-3 py-2 text-xs",
                  position === p.id
                    ? "border-[#a8ff57] bg-[#a8ff57]/10 text-white"
                    : "border-[#2a2a2a] bg-[#1a1a1a] text-white/70 hover:border-[#3a3a3a]"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Заголовок виджета"><DarkInput value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="Приветствие">
          <Textarea
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            rows={2}
            className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-white/40 resize-none"
          />
        </Field>

        <Field label="Аватар бота">
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              className="h-12 w-12 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] overflow-hidden flex items-center justify-center"
            >
              {avatar
                ? <img src={avatar} alt="" className="h-full w-full object-cover" />
                : <Camera className="h-4 w-4 text-white/40" />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const r = new FileReader();
                r.onload = () => setAvatar(r.result as string);
                r.readAsDataURL(f);
              }}
            />
            <Button
              variant="outline"
              onClick={() => fileRef.current?.click()}
              className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#2a2a2a]"
            >
              Загрузить
            </Button>
          </div>
        </Field>

        <SectionTitle className="mt-6">Код установки</SectionTitle>
        <div className="relative rounded-md border border-[#2a2a2a] bg-[#0f0f0f] p-3">
          <pre className="text-xs text-[#a8ff57] font-mono overflow-x-auto whitespace-pre">{snippet}</pre>
          <button
            onClick={() => { navigator.clipboard.writeText(snippet); toast.success("Скопировано"); }}
            className="absolute top-2 right-2 p-1.5 rounded hover:bg-[#2a2a2a] text-white/60"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex justify-end mt-5">
          <Button onClick={() => toast.success("Виджет сохранён")} className="bg-[#a8ff57] text-black hover:bg-[#a8ff57]/90">
            Сохранить
          </Button>
        </div>
      </Card>

      {/* Live preview */}
      <Card>
        <SectionTitle>Превью</SectionTitle>
        <div className="relative rounded-lg border border-[#2a2a2a] bg-gradient-to-br from-[#1f1f1f] to-[#141414] h-[460px] overflow-hidden">
          {/* Mock browser chrome */}
          <div className="h-7 border-b border-[#2a2a2a] bg-[#0f0f0f] flex items-center gap-1.5 px-3">
            <span className="h-2 w-2 rounded-full bg-[#ff5f56]" />
            <span className="h-2 w-2 rounded-full bg-[#ffbd2e]" />
            <span className="h-2 w-2 rounded-full bg-[#27c93f]" />
            <div className="ml-3 flex-1 h-4 rounded bg-[#1a1a1a] text-[10px] text-white/40 px-2 leading-4 truncate">
              https://example.com
            </div>
          </div>

          {/* Mock page content */}
          <div className="p-6 space-y-3">
            <div className="h-6 w-1/3 rounded bg-[#2a2a2a]" />
            <div className="h-3 w-3/4 rounded bg-[#1f1f1f]" />
            <div className="h-3 w-2/3 rounded bg-[#1f1f1f]" />
            <div className="h-3 w-1/2 rounded bg-[#1f1f1f]" />
            <div className="grid grid-cols-3 gap-3 pt-4">
              {[1,2,3].map((i) => <div key={i} className="h-20 rounded bg-[#1a1a1a]" />)}
            </div>
          </div>

          {/* Widget bubble */}
          <div className={cn("absolute", pos.cls)}>
            <button
              className="h-14 w-14 rounded-full shadow-lg flex items-center justify-center"
              style={{ background: color }}
            >
              {avatar
                ? <img src={avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                : <MessageCircle className="h-6 w-6 text-black" />}
            </button>
          </div>
        </div>
        <div className="mt-3 text-xs text-white/40">
          Виджет «{title}» появится в позиции {pos.label} с приветствием: «{greeting}»
        </div>
      </Card>
    </div>
  );
}

// ===== UI helpers ===========================================================

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-xs uppercase tracking-wider text-white/40 mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("text-sm font-medium text-white/80 mb-3", className)}>{children}</div>;
}

function DarkInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Input
      {...props}
      className={cn("bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-white/40 h-10", props.className)}
    />
  );
}

function DarkSelect({
  value, onValueChange, options,
}: {
  value: string;
  onValueChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-10">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
        {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
