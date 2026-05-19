import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { KnowledgeDocumentUploadBody } from "@botmate/shared";
import { apiClient } from "@/lib/api/client";
import { qk } from "@/lib/query-keys";
import { isRealAuthEnabled } from "@/lib/auth/config";

export function useKnowledgeBases() {
  return useQuery({
    queryKey: qk.knowledge.bases,
    queryFn: () => apiClient.listKnowledgeBases(),
    enabled: isRealAuthEnabled(),
    staleTime: 15_000,
  });
}

export function useCreateKnowledgeBase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; assistantId?: string }) =>
      apiClient.createKnowledgeBase(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.knowledge.bases }),
  });
}

export function useKnowledgeDocuments(baseId: string | undefined) {
  return useQuery({
    queryKey: baseId ? qk.knowledge.documents(baseId) : ["knowledge", "documents", "idle"] as const,
    queryFn: () => apiClient.listKnowledgeDocuments(baseId!),
    enabled: isRealAuthEnabled() && Boolean(baseId),
    staleTime: 5_000,
    refetchInterval: (q) => {
      const items = q.state.data?.items ?? [];
      const hasInflight = items.some(
        (d) => d.status === "pending" || d.status === "processing",
      );
      return hasInflight ? 5_000 : false;
    },
  });
}

export function useUploadKnowledgeDocument(baseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: KnowledgeDocumentUploadBody) =>
      apiClient.uploadKnowledgeDocument(baseId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.knowledge.documents(baseId) });
      void qc.invalidateQueries({ queryKey: qk.knowledge.bases });
    },
  });
}

export function useDeleteKnowledgeDocument(baseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) =>
      apiClient.deleteKnowledgeDocument(baseId, documentId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.knowledge.documents(baseId) });
    },
  });
}
