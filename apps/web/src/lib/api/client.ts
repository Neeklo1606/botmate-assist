/**
 * Typed API client with auth interceptors (Phase 1).
 */
import { ApiClientError } from "@botmate/shared";
import { createApiClient } from "@botmate/api-client";
import { qk } from "@/lib/query-keys";
import type { QueryClient } from "@tanstack/react-query";

const baseUrl =
  (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_URL ??
  "http://localhost:3001";

export const apiClient = createApiClient({
  baseUrl,
  credentials: "include",
});

let queryClientRef: QueryClient | null = null;

export function attachAuthInterceptors(queryClient: QueryClient): void {
  queryClientRef = queryClient;

  apiClient.useResponse(async ({ path, response }) => {
    if (response.status === 401 && !path.includes("/auth/login") && !path.includes("/auth/register")) {
      queryClient.setQueryData(qk.auth.currentUser, null);
    }
    return response;
  });
}

export function handleAuthMutationError(error: unknown): string {
  if (error instanceof ApiClientError) {
    const code = error.code;
    if (code === "AUTH_004" || code === "AUTH_002") {
      return "Неверный email или пароль";
    }
    if (code === "AUTH_003") {
      return "Пользователь уже существует";
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Произошла ошибка";
}

export function getAttachedQueryClient(): QueryClient | null {
  return queryClientRef;
}
