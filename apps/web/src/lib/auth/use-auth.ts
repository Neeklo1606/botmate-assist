/**
 * Unified auth hooks (Phase 1).
 * Replaces lib/hooks/use-auth.ts and lib/auth/hooks.ts public API.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import {
  completeBriefOnboarding,
  fetchCurrentUser,
  loginWithEmail,
  loginWithTelegram,
  logout,
  signupWithEmail,
} from "./auth-service";
import type { BriefLoginInput, BriefLoginResult } from "./auth-service";

export function useCurrentUser() {
  return useQuery({
    queryKey: qk.auth.currentUser,
    queryFn: fetchCurrentUser,
    staleTime: 60_000,
  });
}

export function useLoginWithEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: loginWithEmail,
    onSuccess: (user) => {
      qc.setQueryData(qk.auth.currentUser, user);
    },
  });
}

export function useSignupWithEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: signupWithEmail,
    onSuccess: (user) => {
      qc.setQueryData(qk.auth.currentUser, user);
    },
  });
}

export function useLoginWithTelegram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: loginWithTelegram,
    onSuccess: (user) => {
      qc.setQueryData(qk.auth.currentUser, user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      qc.setQueryData(qk.auth.currentUser, null);
      qc.removeQueries({ queryKey: qk.auth.currentUser });
    },
  });
}

/** @deprecated Use completeBriefOnboarding via useBriefOnboardingComplete */
export function useBriefLogin(): (input: BriefLoginInput) => Promise<BriefLoginResult> {
  const qc = useQueryClient();
  return async (input: BriefLoginInput) => {
    const result = await completeBriefOnboarding(input);
    qc.setQueryData(qk.auth.currentUser, result.user);
    return result;
  };
}

export function useBriefLogout(): () => void {
  const logoutMut = useLogout();
  return () => {
    logoutMut.mutate();
  };
}

export function useBriefOnboardingComplete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: completeBriefOnboarding,
    onSuccess: (result) => {
      qc.setQueryData(qk.auth.currentUser, result.user);
    },
  });
}
