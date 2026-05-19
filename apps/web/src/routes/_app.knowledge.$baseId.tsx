/**
 * /knowledge/$baseId — детальная страница базы знаний.
 *
 * - Список документов с реальным статусом обработки (pending/processing/ready/error).
 * - Загрузка через drag&drop и file picker (PDF, DOCX, TXT, Markdown).
 * - Удаление документа.
 * - Авто-обновление списка, пока есть обрабатываемые документы.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import type { KnowledgeDocumentDto } from "@botmate/shared";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProductApiGate } from "@/components/app/product-api-gate";
import { PageHeader } from "@/components/app/page-header";
import { FeatureEmptyState } from "@/components/app/feature-empty-state";
import {
  useDeleteKnowledgeDocument,
  useKnowledgeBases,
  useKnowledgeDocuments,
  useUploadKnowledgeDocument,
} from "@/lib/knowledge/hooks";
import { CABINET_RU } from "@/lib/i18n/cabinet-ru";
import { cn } from "@/lib/utils";

const MAX_BYTES = 25 * 1024 * 1024;

const ALLOWED_MIME: Record<string, string> = {
  "application/pdf": "PDF",
  "text/plain": "TXT",
  "text/markdown": "Markdown",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
};

const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".md", ".markdown", ".docx"];

const STATUS_LABEL: Record<KnowledgeDocumentDto["status"], string> = {
  pending: "В очереди",
  processing: "Обрабатывается",
  ready: "Готов",
  error: "Ошибка",
};

const STATUS_STYLE: Record<KnowledgeDocumentDto["status"], string> = {
  pending: "border-amber-500/30 text-amber-200",
  processing: "border-sky-500/35 text-sky-200",
  ready: "border-lime-500/40 text-lime-200",
  error: "border-red-500/40 text-red-200",
};

export const Route = createFileRoute("/_app/knowledge/$baseId")({
  head: () => ({ meta: [{ title: "База знаний — botme" }] }),
  component: KnowledgeBaseDetailPage,
});

function KnowledgeBaseDetailPage() {
  return (
    <ProductApiGate title={CABINET_RU.nav.knowledge}>
      <KnowledgeBaseDetailLive />
    </ProductApiGate>
  );
}

function KnowledgeBaseDetailLive() {
  const { baseId } = Route.useParams();
  const bases = useKnowledgeBases();
  const docs = useKnowledgeDocuments(baseId);
  const upload = useUploadKnowledgeDocument(baseId);
  const remove = useDeleteKnowledgeDocument(baseId);

  const base = useMemo(
    () => bases.data?.items.find((b) => b.id === baseId),
    [bases.data?.items, baseId],
  );

  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files);
      if (arr.length === 0) return;
      for (const file of arr) {
        const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
        const mimeOk = ALLOWED_MIME[file.type];
        const extOk = ALLOWED_EXTENSIONS.includes(ext);
        if (!mimeOk && !extOk) {
          toast.error(`«${file.name}» — формат не поддерживается. Разрешены PDF, DOCX, TXT, Markdown.`);
          continue;
        }
        if (file.size > MAX_BYTES) {
          toast.error(`«${file.name}» больше 25 МБ — уменьшите размер.`);
          continue;
        }
        try {
          const mimeType = file.type || (ext === ".md" || ext === ".markdown" ? "text/markdown" : ext === ".txt" ? "text/plain" : "application/octet-stream");
          const base64 = await readAsBase64(file);
          await upload.mutateAsync({
            title: file.name,
            mimeType,
            contentBase64: base64,
          });
          toast.success(`«${file.name}» — загружен и поставлен в очередь обработки.`);
        } catch (err) {
          const message =
            err && typeof err === "object" && "message" in err && typeof err.message === "string"
              ? err.message
              : "Не удалось загрузить файл";
          toast.error(`«${file.name}» — ${message}`);
        }
      }
    },
    [upload],
  );

  const handleDelete = async (doc: KnowledgeDocumentDto) => {
    if (!confirm(`Удалить документ «${doc.title}»? Это действие необратимо.`)) return;
    try {
      await remove.mutateAsync(doc.id);
      toast.success("Документ удалён");
    } catch {
      toast.error("Не удалось удалить документ");
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      void handleFiles(e.dataTransfer.files);
    }
  };

  useEffect(() => {
    if (!upload.isPending && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [upload.isPending]);

  if (bases.isLoading || docs.isLoading) {
    return (
      <div className="flex items-center gap-2 py-12 text-sm text-white/55">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        {CABINET_RU.common.loading}
      </div>
    );
  }

  if (bases.isError) {
    return (
      <FeatureEmptyState
        icon={AlertTriangle}
        title="Не удалось загрузить базу знаний"
        description="Проверьте подключение к API и повторите попытку."
      />
    );
  }

  if (!base) {
    return (
      <div className="space-y-4">
        <BackLink />
        <FeatureEmptyState
          icon={AlertTriangle}
          title="База знаний не найдена"
          description="Возможно, она была удалена или ссылка устарела."
        />
      </div>
    );
  }

  const items = docs.data?.items ?? [];

  return (
    <div className="space-y-6">
      <BackLink />
      <PageHeader
        title={base.name}
        description="Документы базы знаний. Ассистент использует их, чтобы давать точные ответы в чате."
      />

      <UploadDropZone
        dragOver={dragOver}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onPick={() => fileInputRef.current?.click()}
        pending={upload.isPending}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.md,.markdown,.docx,application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            void handleFiles(e.target.files);
          }
        }}
      />

      {docs.isError ? (
        <FeatureEmptyState
          icon={AlertTriangle}
          title="Не удалось загрузить список документов"
          description="Повторите попытку через минуту."
        />
      ) : items.length === 0 ? (
        <FeatureEmptyState
          icon={FileText}
          title="В этой базе пока нет документов"
          description="Перетащите файл в область выше или нажмите «Выбрать файлы». Поддерживаются PDF, DOCX, TXT, Markdown — до 25 МБ каждый."
        />
      ) : (
        <DocumentsTable
          items={items}
          onDelete={handleDelete}
          deletingId={remove.isPending ? (remove.variables as string | undefined) : undefined}
        />
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/knowledge"
      className="inline-flex items-center gap-1.5 text-xs text-white/55 hover:text-white"
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
      Назад к базам знаний
    </Link>
  );
}

function UploadDropZone(props: {
  dragOver: boolean;
  pending: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onPick: () => void;
}) {
  return (
    <div
      role="region"
      aria-label="Загрузка документов"
      onDragOver={props.onDragOver}
      onDragLeave={props.onDragLeave}
      onDrop={props.onDrop}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
        props.dragOver
          ? "border-[#a8ff57] bg-[#a8ff57]/[0.05]"
          : "border-[#2a2a2a] bg-[#141414]",
      )}
    >
      <span
        className="flex h-10 w-10 items-center justify-center rounded-lg"
        style={{
          background: "rgba(168,255,87,0.10)",
          color: "#a8ff57",
          border: "1px solid rgba(168,255,87,0.25)",
        }}
        aria-hidden
      >
        <Upload className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium text-white">
          Перетащите файлы сюда или выберите вручную
        </p>
        <p className="text-xs text-white/55">
          PDF, DOCX, TXT, Markdown · до 25 МБ каждый
        </p>
      </div>
      <Button
        type="button"
        variant="brand"
        size="sm"
        onClick={props.onPick}
        disabled={props.pending}
      >
        {props.pending ? (
          <>
            <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden />
            Загрузка…
          </>
        ) : (
          "Выбрать файлы"
        )}
      </Button>
    </div>
  );
}

function DocumentsTable(props: {
  items: KnowledgeDocumentDto[];
  onDelete: (doc: KnowledgeDocumentDto) => void;
  deletingId?: string;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#1a1a1a]">
      <header className="grid grid-cols-[1fr_120px_140px_120px_40px] gap-2 border-b border-[#2a2a2a] px-4 py-3 text-[10px] font-medium uppercase tracking-wide text-white/45">
        <span>Документ</span>
        <span>Тип</span>
        <span>Статус</span>
        <span className="text-right">Размер</span>
        <span aria-hidden />
      </header>
      <ul>
        {props.items.map((doc) => {
          const ext = ALLOWED_MIME[doc.mimeType] ?? doc.mimeType.split("/")[1]?.toUpperCase() ?? "—";
          const deleting = props.deletingId === doc.id;
          return (
            <li
              key={doc.id}
              className="grid grid-cols-[1fr_120px_140px_120px_40px] items-center gap-2 border-b border-[#2a2a2a] px-4 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <FileText className="h-4 w-4 flex-none text-white/45" strokeWidth={1.75} />
                  <span className="truncate">{doc.title}</span>
                </div>
                <div className="mt-0.5 text-[11px] text-white/40">
                  Загружен {new Date(doc.createdAt).toLocaleString("ru-RU")}
                </div>
                {doc.status === "error" && doc.errorMessage ? (
                  <div className="mt-1 line-clamp-2 text-[11px] text-red-300/80">
                    {doc.errorMessage}
                  </div>
                ) : null}
              </div>
              <span className="text-xs text-white/55">{ext}</span>
              <StatusBadge status={doc.status} />
              <span className="text-right text-xs tabular-nums text-white/55">
                {formatBytes(doc.byteSize)}
              </span>
              <button
                type="button"
                onClick={() => props.onDelete(doc)}
                disabled={deleting}
                aria-label={`Удалить «${doc.title}»`}
                className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-white/45 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function StatusBadge({ status }: { status: KnowledgeDocumentDto["status"] }) {
  const Icon =
    status === "ready" ? CheckCircle2
    : status === "error" ? AlertTriangle
    : Loader2;
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full border bg-black/30 px-2 py-0.5 text-[11px]",
        STATUS_STYLE[status],
      )}
    >
      <Icon
        className={cn(
          "h-3 w-3",
          (status === "pending" || status === "processing") && "animate-spin",
        )}
        strokeWidth={2}
        aria-hidden
      />
      {STATUS_LABEL[status]}
    </span>
  );
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 Б";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} МБ`;
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        const idx = result.indexOf(",");
        resolve(idx >= 0 ? result.slice(idx + 1) : result);
      } else {
        reject(new Error("Не удалось прочитать файл"));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("Ошибка чтения файла"));
    reader.readAsDataURL(file);
  });
}
