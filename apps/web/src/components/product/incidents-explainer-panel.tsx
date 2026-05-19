import { FeatureMaturityBadge } from "@/components/product/feature-maturity-badge";
import { RUNTIME_SURFACE_MATURITY } from "@/lib/product/feature-maturity";

export function IncidentsExplainerPanel() {
  return (
    <section className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-white/60">
      <div className="mb-1 flex items-center gap-2">
        <span className="font-medium text-white/80">Что такое инциденты?</span>
        <FeatureMaturityBadge maturity={RUNTIME_SURFACE_MATURITY.incidents} />
      </div>
      <p>
        Сводка сигналов: согласованность данных, сверка очередей и аудит политик. Нажмите{" "}
        <strong className="text-white/75">Подтвердить</strong>, чтобы убрать шум во время
        разбора. Подробности по конкретному запуску — в карточке исполнения.
      </p>
    </section>
  );
}
