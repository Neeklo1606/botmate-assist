import { z } from "zod";

/** Stable API error codes (aligned with backend). */
export const ApiErrorCodeSchema = z.enum([
  "AUTH_001",
  "AUTH_002",
  "AUTH_003",
  "VALIDATION_001",
  "VALIDATION_002",
  "RATE_001",
  "RATE_002",
  "NOT_FOUND_001",
  "FORBIDDEN_001",
  "INTERNAL_001",
  "PROVIDER_001",
  "PROVIDER_002",
  "PROVIDER_003",
  "COST_001",
  "INTEGRATION_001",
]);

export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;

export const ApiErrorBodySchema = z.object({
  code: ApiErrorCodeSchema.or(z.string()),
  message: z.string(),
  trace_id: z.string().optional(),
});

export const ApiErrorResponseSchema = z.object({
  error: ApiErrorBodySchema,
});

export type ApiErrorBody = z.infer<typeof ApiErrorBodySchema>;
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly traceId?: string;

  constructor(input: { code: string; message: string; status: number; traceId?: string }) {
    super(input.message);
    this.name = "ApiClientError";
    this.code = input.code;
    this.status = input.status;
    this.traceId = input.traceId;
  }
}

export function parseApiErrorResponse(
  payload: unknown,
  status: number,
): ApiClientError | null {
  const parsed = ApiErrorResponseSchema.safeParse(payload);
  if (!parsed.success) {
    return null;
  }
  return new ApiClientError({
    code: parsed.data.error.code,
    message: parsed.data.error.message,
    status,
    traceId: parsed.data.error.trace_id,
  });
}
