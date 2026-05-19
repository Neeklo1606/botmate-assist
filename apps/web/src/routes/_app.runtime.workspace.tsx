/**
 * `/runtime/workspace` — Phase 9E operational workspace shell (additive).
 */
import { createFileRoute } from "@tanstack/react-router";
import { RuntimeWorkspaceShell } from "@/components/runtime/workspace/runtime-workspace-shell";
import { runtimeTenantUiEnabled, runtimeWorkspaceUiEnabled } from "@/lib/runtime/config";

interface WorkspaceSearch {
  focus?: string;
}

export const Route = createFileRoute("/_app/runtime/workspace")({
  validateSearch: (search: Record<string, unknown>): WorkspaceSearch => ({
    focus: typeof search.focus === "string" && search.focus.trim() ? search.focus.trim() : undefined,
  }),
  head: () => ({
    meta: [{ title: "Рабочее пространство runtime — botme" }],
  }),
  component: RuntimeWorkspaceRoute,
});

function RuntimeWorkspaceRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  if (!runtimeTenantUiEnabled() || !runtimeWorkspaceUiEnabled()) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-white">Рабочее пространство runtime</h1>
        <p className="text-sm text-white/60">
          Раздел недоступен на вашем тарифе. Перейдите на «Про», чтобы открыть журнал
          исполнений, инциденты и инструменты оператора.
        </p>
      </div>
    );
  }

  return (
    <RuntimeWorkspaceShell
      focusExecutionId={search.focus}
      onFocusExecution={(id) =>
        void navigate({
          search: id ? { focus: id } : {},
          replace: true,
        })
      }
    />
  );
}
