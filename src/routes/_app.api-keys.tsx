/**
 * /app/api-keys — API keys management.
 *
 * All actions are mocked. // TODO: replace with real API
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Copy, Trash2, KeyRound, AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/api-keys")({
  component: ApiKeysPage,
});

interface ApiKey {
  id: string;
  name: string;
  key: string;        // full key (only kept in memory after creation)
  masked: string;
  created: string;
  lastUsed: string;
}

const INITIAL_KEYS: ApiKey[] = [
  { id: "k1", name: "Production",        key: "sk-prod-9f8a7b6c5d4e3f2g1h0i", masked: "sk-prod-...0i", created: "12 апр 2026", lastUsed: "2 мин назад" },
  { id: "k2", name: "Staging integration", key: "sk-stg-aabbccddeeff00112233", masked: "sk-stg-...3344",  created: "5 апр 2026",  lastUsed: "вчера" },
  { id: "k3", name: "Local dev",         key: "sk-dev-1234567890abcdef0000", masked: "sk-dev-...0000", created: "1 мар 2026",  lastUsed: "никогда" },
];

function genKey() {
  const part = () => Math.random().toString(36).slice(2, 10);
  return `sk-${part()}${part()}${part()}`;
}

function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>(INITIAL_KEYS);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [reveal, setReveal] = useState<ApiKey | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);

  const create = () => {
    const name = newName.trim();
    if (!name) return;
    const full = genKey();
    const k: ApiKey = {
      id: `k${Date.now()}`,
      name,
      key: full,
      masked: full.slice(0, 7) + "..." + full.slice(-4),
      created: "сейчас",
      lastUsed: "никогда",
    };
    setKeys((arr) => [k, ...arr]);
    setNewName("");
    setCreateOpen(false);
    setReveal(k);
  };

  const revoke = (k: ApiKey) => {
    setKeys((arr) => arr.filter((x) => x.id !== k.id));
    setRevokeTarget(null);
    toast.success(`Ключ «${k.name}» отозван`);
  };

  const copy = (text: string, label = "Скопировано") => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  return (
    <div className="min-h-full bg-[#141414] text-white">
      <div className="px-6 py-5 border-b border-[#2a2a2a] flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold inline-flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-[#a8ff57]" /> API Ключи
          </h1>
          <p className="text-sm text-white/50 mt-1">Доступ к Botmate API из ваших приложений</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-[#a8ff57] text-black hover:bg-[#a8ff57]/90">
          <Plus className="h-4 w-4 mr-1.5" /> Создать ключ
        </Button>
      </div>

      <div className="p-6">
        <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#141414] text-white/60">
              <tr>
                <th className="text-left p-3 font-medium">Название</th>
                <th className="text-left p-3 font-medium">Ключ</th>
                <th className="text-left p-3 font-medium">Создан</th>
                <th className="text-left p-3 font-medium">Последнее использование</th>
                <th className="w-32 p-3"></th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-t border-[#2a2a2a] hover:bg-[#222]">
                  <td className="p-3 font-medium">{k.name}</td>
                  <td className="p-3 font-mono text-xs text-white/70">{k.masked}</td>
                  <td className="p-3 text-white/60">{k.created}</td>
                  <td className="p-3 text-white/60">{k.lastUsed}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => copy(k.masked, "Маска скопирована")}
                        className="p-1.5 rounded hover:bg-[#2a2a2a] text-white/70"
                        title="Скопировать"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setRevokeTarget(k)}
                        className="p-1.5 rounded hover:bg-red-500/10 text-red-400"
                        title="Отозвать"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {keys.length === 0 && (
                <tr><td colSpan={5} className="p-10 text-center text-white/40">Нет ключей. Создайте первый.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[#0f0f0f] border-[#2a2a2a] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Создать API ключ</DialogTitle>
            <DialogDescription className="text-white/50">
              Дайте ключу осмысленное название, чтобы потом легко его узнать.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
              placeholder="Например: Production"
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-white/40"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)} className="text-white/70 hover:bg-[#2a2a2a]">Отмена</Button>
            <Button onClick={create} disabled={!newName.trim()} className="bg-[#a8ff57] text-black hover:bg-[#a8ff57]/90 disabled:opacity-40">
              Создать
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reveal modal — shown once after creation */}
      <Dialog open={!!reveal} onOpenChange={(o) => !o && setReveal(null)}>
        <DialogContent className="bg-[#0f0f0f] border-[#2a2a2a] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="inline-flex items-center gap-2">
              <Check className="h-5 w-5 text-[#a8ff57]" /> Ключ создан
            </DialogTitle>
          </DialogHeader>

          <div className="rounded-md border border-[#facc15]/30 bg-[#facc15]/10 p-3 text-sm text-[#facc15] flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Сохраните ключ — он больше не будет показан.</span>
          </div>

          {reveal && (
            <div className="mt-2 rounded-md border border-[#2a2a2a] bg-[#1a1a1a] p-3 flex items-center gap-2">
              <code className="flex-1 font-mono text-xs text-[#a8ff57] break-all">{reveal.key}</code>
              <button
                onClick={() => copy(reveal.key)}
                className="p-2 rounded hover:bg-[#2a2a2a] text-white/70 shrink-0"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button onClick={() => setReveal(null)} className="bg-[#a8ff57] text-black hover:bg-[#a8ff57]/90">
              Я сохранил ключ
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revoke confirmation */}
      <Dialog open={!!revokeTarget} onOpenChange={(o) => !o && setRevokeTarget(null)}>
        <DialogContent className="bg-[#0f0f0f] border-[#2a2a2a] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="inline-flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" /> Отозвать ключ?
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Ключ <span className="text-white font-medium">«{revokeTarget?.name}»</span> перестанет работать немедленно.
              Все запросы с этим ключом будут возвращать 401. Действие необратимо.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setRevokeTarget(null)} className="text-white/70 hover:bg-[#2a2a2a]">Отмена</Button>
            <Button
              onClick={() => revokeTarget && revoke(revokeTarget)}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Отозвать
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
