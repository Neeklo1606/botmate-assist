/**
 * Tenant artifact explorer — metadata-first + authenticated binary preview (no raw HTML rendering).
 */
import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { useMutation } from "@tanstack/react-query";
import type { RuntimeArtifactsListResponse } from "@botmate/shared";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRuntimeArtifactDetailQuery, useRuntimeArtifactsQuery } from "@/lib/hooks/use-runtime-queries";
import { apiClient } from "@/lib/api/client";
import { runtimeArtifactAuthenticatedPreviewUrl, runtimeArtifactSignedPreviewUrl } from "@/lib/runtime/artifact-preview";

export type ArtifactRow = RuntimeArtifactsListResponse["items"][number];

export interface ArtifactExplorerProps {
  executionId: string;
  browserSessionId?: string;
}

export function ArtifactExplorer(props: ArtifactExplorerProps): ReactElement {
  const [page, setPage] = useState(1);
  const artifacts = useRuntimeArtifactsQuery({
    page,
    ...(props.browserSessionId ? { browserSessionId: props.browserSessionId } : {}),
  });

  const rows = artifacts.data?.items ?? [];

  const screenshots = useMemo(() => rows.filter((r) => r.kind === "screenshot"), [rows]);
  const traces = useMemo(() => rows.filter((r) => r.kind === "trace"), [rows]);
  const downloads = useMemo(
    () => rows.filter((r) => r.kind === "browser_storage" || r.kind === "extract"),
    [rows],
  );
  const snapshots = useMemo(() => rows.filter((r) => r.kind === "html_snapshot"), [rows]);

  const parentRef = useRef<HTMLDivElement>(null);
  const gridRows = useMemo(() => chunk(screenshots, 3), [screenshots]);

  const rowVirt = useVirtualizer({
    count: gridRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 132,
    overscan: 4,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/55">
        <span className="font-mono text-[10px] text-white/45">запуск {props.executionId.slice(0, 12)}…</span>
        {props.browserSessionId ?
          <Badge variant="outline" className="border-white/15 font-mono text-[9px]">
            фильтр по сессии
          </Badge>
        : null}
      </div>

      <Tabs defaultValue="screenshots">
        <TabsList className="flex w-full flex-wrap gap-1 border border-white/10 bg-black/40 p-1">
          <TabsTrigger
            value="screenshots"
            className="text-[10px] text-white/65 data-[state=active]:bg-lime-500/15 data-[state=active]:text-lime-100"
          >
            Скриншоты ({screenshots.length})
          </TabsTrigger>
          <TabsTrigger
            value="traces"
            className="text-[10px] text-white/65 data-[state=active]:bg-lime-500/15 data-[state=active]:text-lime-100"
          >
            Трассы ({traces.length})
          </TabsTrigger>
          <TabsTrigger
            value="downloads"
            className="text-[10px] text-white/65 data-[state=active]:bg-lime-500/15 data-[state=active]:text-lime-100"
          >
            Загрузки ({downloads.length})
          </TabsTrigger>
          <TabsTrigger
            value="snapshots"
            className="text-[10px] text-white/65 data-[state=active]:bg-lime-500/15 data-[state=active]:text-lime-100"
          >
            Снимки страниц ({snapshots.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="screenshots" className="mt-3 outline-none">
          {artifacts.isLoading ?
            <LoaderRow />
          : screenshots.length === 0 ?
            <EmptyHint />
          : <div ref={parentRef} className="max-h-[380px] overflow-y-auto rounded-md border border-white/10">
              <div className="relative w-full" style={{ height: `${rowVirt.getTotalSize()}px` }}>
                {rowVirt.getVirtualItems().map((vi) => {
                  const slice = gridRows[vi.index];
                  if (!slice) return null;
                  return (
                    <div
                      key={vi.key}
                      className="absolute left-0 top-0 grid w-full grid-cols-3 gap-2 px-2"
                      style={{ transform: `translateY(${vi.start}px)` }}
                    >
                      {slice.map((item) => (
                        <ArtifactThumb key={item.id} row={item} onOpen={() => setSelectedId(item.id)} />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          }
        </TabsContent>

        <TabsContent value="traces" className="mt-3 outline-none">
          <ArtifactVirtualTable rows={traces} loading={artifacts.isLoading} onOpen={(id) => setSelectedId(id)} />
        </TabsContent>

        <TabsContent value="downloads" className="mt-3 outline-none">
          <ArtifactVirtualTable rows={downloads} loading={artifacts.isLoading} onOpen={(id) => setSelectedId(id)} />
        </TabsContent>

        <TabsContent value="snapshots" className="mt-3 outline-none">
          <ArtifactVirtualTable rows={snapshots} loading={artifacts.isLoading} onOpen={(id) => setSelectedId(id)} />
        </TabsContent>
      </Tabs>

      <div className="flex justify-between gap-2 text-[11px] text-white/45">
        <span>
          Стр. {page} · всего {artifacts.data?.total ?? "—"}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 border-white/15 bg-transparent text-white/75"
            disabled={page <= 1 || artifacts.isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Назад
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 border-white/15 bg-transparent text-white/75"
            disabled={
              artifacts.isFetching ||
              !artifacts.data ||
              page * artifacts.data.pageSize >= artifacts.data.total
            }
            onClick={() => setPage((p) => p + 1)}
          >
            Далее
          </Button>
        </div>
      </div>

      <ArtifactMetadataDrawer artifactId={selectedId} open={selectedId !== null} onOpenChange={(o) => !o && setSelectedId(null)} />
    </div>
  );
}

function ArtifactThumb(props: { row: ArtifactRow; onOpen: () => void }): ReactElement {
  return (
    <button
      type="button"
      className="rounded-md border border-white/10 bg-black/25 text-left transition-colors hover:border-lime-400/40"
      onClick={props.onOpen}
    >
      <div className="relative flex aspect-video w-full items-center justify-center rounded-t-md bg-black/40 px-2 text-center">
        <span className="text-[10px] leading-snug text-white/35">
          Откройте артефакт, чтобы увидеть предпросмотр и метаданные.
        </span>
      </div>
      <div className="space-y-1 px-2 py-2 font-mono text-[9px] text-white/55">
        <div className="truncate">{props.row.id.slice(0, 12)}…</div>
        <div className="text-white/35">{props.row.kind}</div>
        <div className="truncate text-white/25">{props.row.createdAt}</div>
      </div>
    </button>
  );
}

function ArtifactVirtualTable(props: {
  rows: ArtifactRow[];
  loading: boolean;
  onOpen: (id: string) => void;
}): ReactElement {
  const parentRef = useRef<HTMLDivElement>(null);
  const virt = useVirtualizer({
    count: props.rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 16,
    getItemKey: (i) => props.rows[i]?.id ?? i,
  });

  if (props.loading) return <LoaderRow />;
  if (props.rows.length === 0) return <EmptyHint />;

  return (
    <div ref={parentRef} className="max-h-[360px] overflow-auto rounded-md border border-white/10">
      <div className="sticky top-0 z-[1] grid grid-cols-[120px_1fr_96px_1fr] gap-2 border-b border-white/10 bg-[#141414] px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-white/45">
        <span>Тип</span>
        <span>Создан</span>
        <span>Размер</span>
        <span>Ключ</span>
      </div>
      <div className="relative w-full" style={{ height: `${virt.getTotalSize()}px` }}>
        {virt.getVirtualItems().map((vi) => {
          const r = props.rows[vi.index];
          if (!r) return null;
          return (
            <div
              key={vi.key}
              className="absolute left-0 top-0 w-full px-2"
              style={{ transform: `translateY(${vi.start}px)` }}
            >
              <button
                type="button"
                className="grid w-full grid-cols-[120px_1fr_96px_1fr] gap-2 border-b border-white/5 py-2 text-left text-[11px] text-white/70 hover:bg-white/[0.03]"
                onClick={() => props.onOpen(r.id)}
              >
                <span className="font-mono text-[10px] text-lime-200/85">{r.kind}</span>
                <span className="truncate text-white/45">{r.createdAt}</span>
                <span className="font-mono text-[10px]">{r.byteLength}</span>
                <span className="truncate text-white/35">{r.storageKeySuffix}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ArtifactMetadataDrawer(props: {
  artifactId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): ReactElement {
  const detail = useRuntimeArtifactDetailQuery(props.artifactId);

  const previewToken = useMutation({
    mutationFn: async () => {
      if (!props.artifactId) throw new Error("artifact_missing");
      return apiClient.runtimeArtifactPreviewToken(props.artifactId, {});
    },
  });

  useEffect(() => {
    previewToken.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset stale token payloads when artefact switches
  }, [props.artifactId]);

  const previewCookieHref =
    detail.data?.preview.available === true && props.artifactId ?
      runtimeArtifactAuthenticatedPreviewUrl(detail.data.preview.hrefPath)
    : null;

  const signedHref =
    previewToken.data ?
      runtimeArtifactSignedPreviewUrl(previewToken.data.downloadPath, previewToken.data.token)
    : null;

  const previewSrc = signedHref ?? previewCookieHref;

  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent className="border-white/10 bg-[#141414] text-white">
        <SheetHeader>
          <SheetTitle className="text-white">Метаданные артефакта</SheetTitle>
          <SheetDescription className="font-mono text-[11px] text-white/55">
            {props.artifactId ?? ""}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-3 text-[11px] text-white/75">
          {previewToken.data ?
            <div className="rounded-md border border-lime-500/25 bg-black/35 p-2 text-[10px] text-white/55">
              Подписанный предпросмотр · действует до {previewToken.data.expiresAtIso}
            </div>
          : null}
          {previewToken.isError ?
            <div className="rounded-md border border-red-500/30 bg-black/35 p-2 text-[10px] text-red-200/85">
              {previewToken.error instanceof Error ? previewToken.error.message : "не удалось получить токен предпросмотра"}
            </div>
          : null}
          {detail.isLoading ?
            <Loader2 className="size-6 animate-spin text-white/35" aria-hidden />
          : detail.data ?
            <>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-white/15">
                  {detail.data.artifact.kind}
                </Badge>
                {detail.data.artifact.expiresAt ?
                  <Badge variant="outline" className="border-amber-400/40 text-amber-100">
                    срок · {detail.data.artifact.expiresAt}
                  </Badge>
                : <Badge variant="outline" className="border-white/15">
                    срок хранения неизвестен
                  </Badge>}
                <Badge variant="outline" className="border-white/15">
                  предпросмотр · {detail.data.preview.available ? "доступен" : "отключён"}
                </Badge>
              </div>
              {detail.data.preview.available === true ?
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 border-white/15 bg-transparent text-[10px] text-white/80"
                    disabled={previewToken.isPending || !props.artifactId}
                    onClick={() => previewToken.mutate()}
                  >
                    {previewToken.isPending ?
                      <>
                        <Loader2 className="mr-1 inline size-3 animate-spin" aria-hidden /> Запрос…
                      </>
                    : "Запросить токен предпросмотра"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 border-white/15 bg-transparent text-[10px] text-white/80"
                    disabled={!signedHref}
                    onClick={() => {
                      if (!signedHref) return;
                      window.open(signedHref, "_blank", "noopener,noreferrer");
                    }}
                  >
                    Открыть предпросмотр
                  </Button>
                  {previewCookieHref ?
                    <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-[10px] text-white/55 hover:bg-white/10" asChild>
                      <a href={previewCookieHref} target="_blank" rel="noreferrer" title="С использованием сессионной cookie">
                        Альтернативный предпросмотр
                      </a>
                    </Button>
                  : null}
                </div>
              : null}
              <div className="rounded-md border border-white/10 bg-black/25 p-2 font-mono text-[10px] text-white/55">
                контрольная сумма · {detail.data.artifact.sha256 ?? "—"}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-white/35">Источник</div>
              <ul className="space-y-1 text-[11px] text-white/65">
                <li>
                  сессия браузера ·{" "}
                  <span className="font-mono text-lime-200/85">{detail.data.artifact.browserSessionId}</span>
                </li>
                <li>
                  запуск браузера ·{" "}
                  <span className="font-mono text-lime-200/85">{detail.data.artifact.browserRunId ?? "—"}</span>
                </li>
              </ul>
              <div className="text-[10px] uppercase tracking-wide text-white/35">Метаданные</div>
              <pre className="max-h-[220px] overflow-auto rounded-md border border-white/10 bg-black/40 p-2 text-[10px] text-white/55">
                {JSON.stringify(detail.data.artifact.metadataPreview, null, 2)}
              </pre>
              {previewSrc && detail.data.artifact.contentType?.startsWith("image/") ?
                <div className="space-y-2">
                  <div className="text-[10px] uppercase tracking-wide text-white/35">
                    Безопасный предпросмотр {signedHref ? "(подписанная ссылка)" : "(резервный режим)"}
                  </div>
                  <img src={previewSrc} alt="" loading="lazy" className="max-h-[280px] rounded-md border border-white/10 object-contain" />
                </div>
              : null}
            </>
          : <p className="text-white/45">Не удалось загрузить метаданные.</p>}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function LoaderRow(): ReactElement {
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="size-6 animate-spin text-white/35" aria-hidden />
    </div>
  );
}

function EmptyHint(): ReactElement {
  return <p className="py-8 text-center text-[11px] text-white/45">Нет артефактов в текущей странице.</p>;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
