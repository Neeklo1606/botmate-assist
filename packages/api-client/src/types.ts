export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiClientConfig {
  baseUrl: string;
  /** Bearer token or raw token (Bearer prefix added automatically). */
  getAccessToken?: () => string | null | undefined;
  /** For widget / server integrations. */
  getApiKey?: () => string | null | undefined;
  credentials?: RequestCredentials;
  fetch?: typeof fetch;
  defaultHeaders?: Record<string, string>;
}

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export type RequestInterceptor = (input: {
  path: string;
  init: RequestInit;
}) => Promise<RequestInit> | RequestInit;

export type ResponseInterceptor = (input: {
  path: string;
  response: Response;
}) => Promise<Response> | Response;
