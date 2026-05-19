/**
 * /knowledge — список баз знаний (API).
 *
 * Index-роут для `/knowledge`; детальная страница базы — `/knowledge/$baseId`.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { ProductApiGate } from "@/components/app/product-api-gate";
import { FeatureEmptyState } from "@/components/app/feature-empty-state";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CABINET_RU } from "@/lib/i18n/cabinet-ru";
import { useKnowledgeBases, useCreateKnowledgeBase } from "@/lib/knowledge/hooks";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/knowledge/")({
  head: () => ({
    meta: [{ title: "База знаний — botme" }],
  }),
  component: KnowledgePage,
});

function KnowledgePage() {
  return (
    <ProductApiGate title={CABINET_RU.nav.knowledge}>
      <KnowledgePageLive />
    </ProductApiGate>
  );
}

function KnowledgePageLive() {
  const bases = useKnowledgeBases();
  const create = useCreateKnowledgeBase();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");

  const openCreate = () => {
    setName("");
    setDialogOpen(true);
  };

  const submitCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Укажите название базы");
      return;
    }
    try {
      await create.mutateAsync({ name: trimmed });
      setDialogOpen(false);
      toast.success("База знаний создана");
    } catch {
      toast.error("Не удалось создать базу");
    }
  };

  if (bases.isLoading) {
    return (
      <div className="flex items-center gap-2 py-12 text-sm text-ink-muted">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        {CABINET_RU.common.loading}
      </div>
    );
  }

  if (bases.isError) {
    return (
      <FeatureEmptyState
        icon={BookOpen}
        title="Не удалось загрузить базы знаний"
        description="Проверьте подключение к API и повторите попытку."
      />
    );
  }

  const items = bases.data?.items ?? [];

  if (items.length === 0) {
    return (
      <>
        <FeatureEmptyState
          icon={BookOpen}
          title={CABINET_RU.knowledge.emptyTitle}
          description={CABINET_RU.knowledge.emptyBody}
        />
        <div className="flex justify-center pb-12">
          <Button variant="brand" size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            {CABINET_RU.knowledge.createBase}
          </Button>
        </div>
        <CreateBaseDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          name={name}
          onNameChange={setName}
          pending={create.isPending}
          onSubmit={() => void submitCreate()}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={CABINET_RU.knowledge.title}
        description={CABINET_RU.knowledge.description}
        actions={
          <Button variant="brand" size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            {CABINET_RU.knowledge.createBase}
          </Button>
        }
      />

      <section className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a]">
        <h2 className="border-b border-[#2a2a2a] px-4 py-3 text-sm font-medium text-white">
          {CABINET_RU.knowledge.basesList}
        </h2>
        <ul className="divide-y divide-[#2a2a2a]">
          {items.map((base) => (
            <li key={base.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-white">{base.name}</p>
                <p className="text-xs text-white/45">
                  {CABINET_RU.knowledge.updated}:{" "}
                  {new Date(base.updatedAt).toLocaleString("ru-RU")}
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/knowledge/$baseId" params={{ baseId: base.id }}>
                  Открыть базу
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-white/40">
        Загружайте файлы (PDF, DOCX, TXT, Markdown) внутри базы — ассистент будет искать ответы в них.
      </p>

      <CreateBaseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        name={name}
        onNameChange={setName}
        pending={create.isPending}
        onSubmit={() => void submitCreate()}
      />
    </div>
  );
}

function CreateBaseDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  onNameChange: (v: string) => void;
  pending: boolean;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="border-border bg-[#1a1a1a] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{CABINET_RU.knowledge.createBase}</DialogTitle>
        </DialogHeader>
        <Input
          value={props.name}
          onChange={(e) => props.onNameChange(e.target.value)}
          placeholder={CABINET_RU.knowledge.baseName}
          className="bg-[#141414] border-[#2a2a2a] text-white"
          onKeyDown={(e) => e.key === "Enter" && props.onSubmit()}
        />
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghostInk" onClick={() => props.onOpenChange(false)}>
            {CABINET_RU.common.cancel}
          </Button>
          <Button variant="brand" disabled={props.pending} onClick={props.onSubmit}>
            {props.pending ? CABINET_RU.common.loading : CABINET_RU.common.create}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
