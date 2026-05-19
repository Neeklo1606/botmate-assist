import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Binoculars,
  BookOpen,
  Bot,
  FolderKanban,
  GitCompare,
  Inbox,
  KeyRound,
  Layers,
  LayoutDashboard,
  MessageCircle,
  Phone,
  Plug,
  ShieldCheck,
  Siren,
  Users,
  Building2,
} from "lucide-react";
import { isWebProductionStrictHint } from "@/lib/production/config";
import { isRuntimeAdvancedMode } from "@/lib/product/runtime-ux-mode";
import { CABINET_RU } from "@/lib/i18n/cabinet-ru";
import { runtimeTenantUiEnabled, runtimeWorkspaceUiEnabled } from "@/lib/runtime/config";

export interface CabinetNavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  exact?: boolean;
  maturity?: "beta" | "experimental";
}

const PRODUCTION_PLACEHOLDER_NAV = new Set(["/audit", "/visitors", "/calls"]);

function filterNavForProduction(items: CabinetNavItem[]): CabinetNavItem[] {
  if (!isWebProductionStrictHint()) return items;
  return items.filter((item) => !PRODUCTION_PLACEHOLDER_NAV.has(item.to));
}

export function useCabinetNavItems(): CabinetNavItem[] {
  const [advanced, setAdvanced] = useState(isRuntimeAdvancedMode());

  useEffect(() => {
    const sync = () => setAdvanced(isRuntimeAdvancedMode());
    sync();
    window.addEventListener("bm:runtime-ux-mode", sync);
    return () => window.removeEventListener("bm:runtime-ux-mode", sync);
  }, []);

  return useMemo(() => {
    const runtimeNav: CabinetNavItem[] =
      !runtimeTenantUiEnabled() ?
        []
      : advanced && runtimeWorkspaceUiEnabled() ?
        [
          { to: "/runtime", label: CABINET_RU.nav.runtime, icon: Activity },
          { to: "/runtime/workspace", label: CABINET_RU.nav.runtimeWorkspace, icon: Layers, maturity: "beta" },
          { to: "/runtime/operator", label: CABINET_RU.nav.runtimeOperator, icon: Binoculars, maturity: "experimental" },
          { to: "/runtime/incidents", label: CABINET_RU.nav.runtimeIncidents, icon: Siren, maturity: "beta" },
          { to: "/runtime/consistency", label: CABINET_RU.nav.runtimeConsistency, icon: AlertTriangle, maturity: "experimental" },
          { to: "/runtime/compare", label: CABINET_RU.nav.runtimeCompare, icon: GitCompare, maturity: "beta" },
        ]
      : [{ to: "/runtime", label: CABINET_RU.nav.runtime, icon: Activity }];

    const runtimeAlways: CabinetNavItem[] =
      runtimeTenantUiEnabled() ?
        [{ to: "/runtime", label: CABINET_RU.nav.runtime, icon: Activity }]
      : [];

    return filterNavForProduction([
      { to: "/app", label: "Дашборд", icon: LayoutDashboard, exact: true },
      { to: "/projects", label: "Проекты", icon: FolderKanban },
      { to: "/assistants", label: "Ассистенты", icon: Bot },
      { to: "/knowledge", label: "База знаний", icon: BookOpen },
      { to: "/chat", label: "Чат", icon: MessageCircle },
      { to: "/visitors", label: "Посетители", icon: Users },
      { to: "/calls", label: "Звонки", icon: Phone },
      { to: "/leads", label: "Лиды", icon: Inbox },
      { to: "/workspace", label: "Рабочая область", icon: Building2 },
      { to: "/app-integrations", label: "Интеграции", icon: Plug },
      { to: "/api-keys", label: "API-ключи", icon: KeyRound },
      { to: "/audit", label: "Аудит", icon: ShieldCheck },
      ...(runtimeNav.length > 0 ? runtimeNav : runtimeAlways),
    ]);
  }, [advanced]);
}
