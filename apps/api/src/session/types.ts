import type { Role } from "../types.js";

export interface SessionRecord {
  id: string;
  userId: string;
  tenantId: string;
  role: Role;
  email: string;
  fullName: string;
  expiresAt: Date;
}

export interface CreateSessionInput {
  userId: string;
  tenantId: string;
  role: Role;
  email: string;
  fullName: string;
  ttlMs?: number;
}
