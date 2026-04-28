/**
 * Хуки auth (mock, in-memory).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { repository } from "@/lib/mock/repository";
import { qk } from "@/lib/query-keys";

export const useCurrentUser = () =>
  useQuery({
    queryKey: qk.auth.currentUser,
    queryFn: () => repository.getCurrentUser(),
    staleTime: Infinity,
  });

export const useLoginWithTelegram = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => repository.loginWithTelegram(),
    onSuccess: (user) => {
      qc.setQueryData(qk.auth.currentUser, user);
    },
  });
};

export const useLoginWithEmail = () => {
  const qc = useQueryClient();
  return useMutation({
    // TODO: replace with real API — POST /api/auth/login
    mutationFn: (payload: { email: string; password: string }) =>
      repository.loginWithEmail(payload),
    onSuccess: (user) => {
      qc.setQueryData(qk.auth.currentUser, user);
    },
  });
};

export const useSignupWithEmail = () => {
  const qc = useQueryClient();
  return useMutation({
    // TODO: replace with real API — POST /api/auth/signup
    mutationFn: (payload: { name: string; email: string; password: string }) =>
      repository.signupWithEmail(payload),
    onSuccess: (user) => {
      qc.setQueryData(qk.auth.currentUser, user);
    },
  });
};

export const useLogout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => repository.logout(),
    onSuccess: () => {
      qc.setQueryData(qk.auth.currentUser, null);
      qc.clear();
    },
  });
};
