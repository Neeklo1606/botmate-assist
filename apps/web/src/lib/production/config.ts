/**
 * Phase 11B — detect accidental mock-mode production deploys (client-side guardrail).
 */
import { isRealAuthEnabled } from "@/lib/auth/config";
import { readAssistantsPersistenceEnv } from "@/lib/assistants/config";
import { readChatPersistenceEnv } from "@/lib/chat/config";
import { readLeadsPersistenceEnv } from "@/lib/leads/config";
import { readProjectsPersistenceEnv } from "@/lib/projects/config";

export function isWebProductionStrictHint(): boolean {
  const raw = import.meta.env.VITE_PRODUCTION_STRICT;
  return raw === "true" || raw === "1";
}

export function webProductionConfigIssues(): string[] {
  if (!isWebProductionStrictHint()) return [];
  const issues: string[] = [];
  if (!isRealAuthEnabled()) issues.push("VITE_USE_REAL_AUTH is not true");
  if (readChatPersistenceEnv() !== "api") issues.push("VITE_CHAT_DATA_SOURCE is not api");
  if (readLeadsPersistenceEnv() !== "api") issues.push("VITE_LEADS_DATA_SOURCE is not api");
  if (readProjectsPersistenceEnv() !== "api") issues.push("VITE_PROJECTS_DATA_SOURCE is not api");
  if (readAssistantsPersistenceEnv() !== "api") issues.push("VITE_ASSISTANTS_DATA_SOURCE is not api");
  return issues;
}
