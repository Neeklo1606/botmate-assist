import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Copy, Trash2, KeyRound, AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ProductApiGate } from "@/components/app/product-api-gate";
import { apiClient } from "@/lib/api/client";
import { qk } from "@/lib/query-keys";
import { EmptyState } from "@/components/app/empty-state";

export const Route = createFileRoute("/_app/api-keys")({
  head: () => ({
    meta: [{ title: "API-ключи — botme" }],
  }),
  component: ApiKeysPage,
});

function ApiKeysPage() {
  return (
    <ProductApiGate title="API-ключи">
      <ApiKeysContent />
    </ProductApiGate>
  );
}

function ApiKeysContent() {
  const qc = useQueryClient();
  const keysQuery = useQuery({
    queryKey: qk.app.apiKeys,
    queryFn: () => apiClient.listApiKeys(),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [reveal, setReveal] = useState<{ name: string; key: string } | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const createMut = useMutation({
    mutationFn: (name: string) => apiClient.createApiKey({ name }),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: qk.app.apiKeys });
      setCreateOpen(false);
      setNewName("");
      setReveal({ name: data.name, key: data.apiKey });
    },
    onError: () => toast.error("Не удалось создать ключ"),
  });

  const revokeMut = useMutation({
    mutationFn: (id: string) => apiClient.revokeApiKey(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.app.apiKeys });
      setRevokeId(null);
      toast.success("Ключ отозван");
    },
    onError: () => toast.error("Не удалось отозвать ключ"),
  });

  const keys = keysQuery.data?.items.filter((k) => k.isActive && !k.revokedAt) ?? [];

  const copy = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success("Скопировано");
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="min-h-full bg-[#141414] text-white">
      <div className="px-6 py-5 border-b border-[#2a2a2a] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold inline-flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-[#a8ff57]" /> API-ключи
          </h1>
          <p className="text-sm text-white/50 mt-1">Доступ к Botmate API из ваших приложений</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-[#a8ff57] text-black hover:bg-[#a8ff57]/90"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Создать ключ
        </Button>
      </div>

      <div className="p-6">
        {keysQuery.isLoading ?
          <p className="text-sm text-white/50">Загрузка…</p>
        : keys.length === 0 ?
          <EmptyState
            icon={<KeyRound className="h-5 w-5" strokeWidth={1.75} />}
            title="Нет API-ключей"
            description="Создайте ключ для интеграции виджета или серверных вызовов API."
            action={
              <Button
                variant="brand"
                size="sm"
                onClick={() => setCreateOpen(true)}
                className="bg-[#a8ff57] text-black hover:bg-[#a8ff57]/90"
              >
                Создать ключ
              </Button>
            }
          />
        : <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#141414] text-white/60">
                <tr>
                  <th className="text-left p-3 font-medium">Название</th>
                  <th className="text-left p-3 font-medium">Префикс</th>
                  <th className="text-left p-3 font-medium">Создан</th>
                  <th className="text-right p-3 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} className="border-t border-[#2a2a2a]">
                    <td className="p-3 text-white">{k.name}</td>
                    <td className="p-3 font-mono text-white/70">{k.keyPrefix}…</td>
                    <td className="p-3 text-white/60">{formatDate(k.createdAt)}</td>
                    <td className="p-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => setRevokeId(k.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
          <DialogHeader>
            <DialogTitle>Новый API-ключ</DialogTitle>
            <DialogDescription className="text-white/50">
              Ключ показывается один раз после создания.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Например: Production widget"
            className="bg-[#141414] border-[#2a2a2a] text-white"
          />
          <Button
            disabled={!newName.trim() || createMut.isPending}
            onClick={() => createMut.mutate(newName.trim())}
            className="w-full bg-[#a8ff57] text-black hover:bg-[#a8ff57]/90"
          >
            Создать
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reveal} onOpenChange={() => setReveal(null)}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
          <DialogHeader>
            <DialogTitle>Сохраните ключ</DialogTitle>
            <DialogDescription className="text-white/50">
              {reveal?.name} — больше не будет показан полностью.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <code className="flex-1 rounded bg-black/40 p-2 text-xs break-all">{reveal?.key}</code>
            <Button size="icon" variant="ghost" onClick={() => reveal && copy(reveal.key)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!revokeId} onOpenChange={() => setRevokeId(null)}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" /> Отозвать ключ?
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Интеграции с этим ключом перестанут работать.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRevokeId(null)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              disabled={revokeMut.isPending}
              onClick={() => revokeId && revokeMut.mutate(revokeId)}
            >
              Отозвать
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
