import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { isRealAuthEnabled } from "@/lib/auth/config";
import { qk } from "@/lib/query-keys";

export function useWorkspaceOverview(enabled = isRealAuthEnabled()) {
  return useQuery({
    queryKey: qk.workspace.overview,
    queryFn: () => apiClient.getWorkspaceOverview(),
    enabled,
    staleTime: 60_000,
  });
}

export function useWorkspaceUsage(enabled = isRealAuthEnabled()) {
  return useQuery({
    queryKey: qk.workspace.usage,
    queryFn: () => apiClient.getWorkspaceUsage(),
    enabled,
    staleTime: 60_000,
  });
}

export function useWorkspaceMembers(enabled = isRealAuthEnabled()) {
  return useQuery({
    queryKey: qk.workspace.members,
    queryFn: () => apiClient.getWorkspaceMembers(),
    enabled,
    staleTime: 60_000,
  });
}

export function useWorkspaceSupportDiagnostics(enabled = isRealAuthEnabled()) {
  return useQuery({
    queryKey: qk.workspace.supportDiagnostics,
    queryFn: () => apiClient.getWorkspaceSupportDiagnostics(),
    enabled,
    staleTime: 30_000,
  });
}

export function useWorkspaceEntitlements(enabled = isRealAuthEnabled()) {
  return useQuery({
    queryKey: qk.workspace.entitlements,
    queryFn: () => apiClient.getWorkspaceEntitlements(),
    enabled,
    staleTime: 120_000,
  });
}

export function useOpenAiIntegrationStatus(enabled = isRealAuthEnabled()) {
  return useQuery({
    queryKey: qk.workspace.openAiStatus,
    queryFn: () => apiClient.getOpenAiIntegrationStatus(),
    enabled,
    staleTime: 30_000,
  });
}

export function useWorkspaceOnboarding(enabled = isRealAuthEnabled()) {
  return useQuery({
    queryKey: qk.workspace.onboarding,
    queryFn: () => apiClient.getWorkspaceOnboarding(),
    enabled,
    staleTime: 60_000,
  });
}

export function useWorkspaceInvites(enabled = isRealAuthEnabled()) {
  return useQuery({
    queryKey: qk.workspace.invites,
    queryFn: () => apiClient.listWorkspaceInvites(),
    enabled,
    staleTime: 30_000,
  });
}
