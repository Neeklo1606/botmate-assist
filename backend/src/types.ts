export type Role = "OWNER" | "ADMIN" | "OPERATOR";

export interface JwtClaims {
  sub: string;
  tenantId: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface ChatSession {
  id: string;
  tenantId: string;
  userId: string;
  createdAt: string;
}

export type MessageRole = "USER" | "ASSISTANT" | "TOOL";

export interface Message {
  id: string;
  sessionId: string;
  tenantId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  tenantId: string;
  sessionId: string;
  name: string;
  contact: string;
  createdAt: string;
}

export type Provider = "OPENAI";

export interface IntegrationAccount {
  id: string;
  userId: string;
  provider: Provider;
  apiKeyEncrypted: string;
  isActive: boolean;
  createdAt: string;
}

export interface ApiKeyPublic {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  keyPrefix: string;
  assistantId?: string;
  allowedDomains?: string[];
  rateLimitPerMin: number;
  isActive: boolean;
  createdAt: string;
  revokedAt?: string;
}
