/**
 * Unified auth provider — syncs TanStack Query user → router.context.auth.
 */
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { qk } from "@/lib/query-keys";
import { fetchCurrentUser } from "./auth-service";
import { isAuthTransientError } from "./api-auth-service";
import type { AuthRouterState } from "@/router";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: user, isPending, isFetching } = useQuery({
    queryKey: qk.auth.currentUser,
    queryFn: fetchCurrentUser,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    // На транзиентные ошибки (сеть/5xx) аккуратно ретраим с экспоненциальным
    // backoff'ом — так UI не залипает с "пустым" пользователем после
    // кратковременного даунтайма API.
    retry: (failureCount, error) => {
      if (isAuthTransientError(error)) return failureCount < 3;
      return false;
    },
    retryDelay: (attempt) => Math.min(30_000, 1_000 * 2 ** attempt),
  });

  const isLoading = isPending || isFetching;

  useEffect(() => {
    const auth: AuthRouterState = {
      isLoading,
      isAuthenticated: !!user,
      user: user ?? null,
    };
    router.update({
      context: {
        ...router.options.context,
        auth,
      },
    });
  }, [user, isLoading, router]);

  // Expose query client for route guards
  useEffect(() => {
    void queryClient;
  }, [queryClient]);

  return <>{children}</>;
}
