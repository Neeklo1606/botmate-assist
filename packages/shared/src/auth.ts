import { z } from "zod";

export const RoleSchema = z.enum(["OWNER", "ADMIN", "OPERATOR", "VIEWER"]);
export type Role = z.infer<typeof RoleSchema>;

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  fullName: z.string().min(1).max(120),
});

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

export const AuthUserSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  email: z.string().email(),
  fullName: z.string(),
  role: RoleSchema,
});

export const AuthSuccessResponseSchema = z.object({
  user: AuthUserSchema,
  token: z.string().optional(),
});

export const AuthMeResponseSchema = z.object({
  user: AuthUserSchema,
});

export const AuthLogoutResponseSchema = z.object({
  ok: z.literal(true),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type AuthUser = z.infer<typeof AuthUserSchema>;
export type AuthSuccessResponse = z.infer<typeof AuthSuccessResponseSchema>;
export type AuthMeResponse = z.infer<typeof AuthMeResponseSchema>;

/** @deprecated Use AuthSuccessResponseSchema */
export const AuthTokenResponseSchema = AuthSuccessResponseSchema;
