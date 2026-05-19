import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { qk } from "@/lib/query-keys";
import type { User } from "@/types/entities";
import { resolveLeadsPersistence } from "./config.js";
import { dtoToCrmLead } from "./map-dto.js";
import type { CrmLead } from "./map-dto.js";

function tenantKey(user: User | null | undefined): string {
  return user?.tenantId ?? "local";
}

/** CRM leads list: API-backed when persistence resolves to `api`, else mock repository (session). */
export function useLeads(user: User | null | undefined) {
  const tk = tenantKey(user);
  const uid = user?.id ?? "anon";
  const apiMode = resolveLeadsPersistence(user) === "api";

  return useQuery<CrmLead[]>({
    queryKey: apiMode ? qk.leads.list(tk, uid) : ([...qk.leads.root, "session", tk, uid] as const),
    queryFn: async () => {
      const res = await apiClient.listLeads({ page: 1, pageSize: 200 });
      return res.items.map(dtoToCrmLead);
    },
    enabled: typeof window !== "undefined" && apiMode && !!user?.tenantId,
    staleTime: 15_000,
  });
}

export function useLeadWorkspaceMutations(user: User | null | undefined) {
  const qc = useQueryClient();

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: qk.leads.root });
  };

  const patchLead = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: import("@botmate/shared").PatchLeadBody }) => {
      return apiClient.patchLead(id, patch);
    },
    onSuccess: invalidate,
  });

  const archiveLead = useMutation({
    mutationFn: async (id: string) => apiClient.archiveLead(id),
    onSuccess: invalidate,
  });

  return { patchLead, archiveLead };
}

export type UseLeadWorkspaceMutations = ReturnType<typeof useLeadWorkspaceMutations>;

export function mergeServerLead(prev: CrmLead, dto: import("@botmate/shared").LeadDto): CrmLead {
  return dtoToCrmLead(dto);
}
