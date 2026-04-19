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
