/**
 * Phase 12D — nudge first test chat when assistant exists but no replies yet.
 */
import { useProductActivation } from "@/lib/hooks/use-product-activation";
import { isRealAuthEnabled } from "@/lib/auth/config";
import { readChatPersistenceEnv } from "@/lib/chat/config";

export function ChatFirstMessageHint() {
  const activation = useProductActivation(isRealAuthEnabled());
  if (readChatPersistenceEnv() !== "api" || !isRealAuthEnabled()) return null;

  const m = activation.data?.milestones;
  if (!m?.firstAssistantCreated || m.firstChatSuccess) return null;

  return (
    <div
      className="border-b border-lime-500/20 bg-lime-500/[0.05] px-4 py-2.5 text-xs text-white/70"
      role="status"
    >
      <strong className="font-medium text-lime-200/90">First chat:</strong> pick or create a session, send a
      short test question, and wait for the assistant reply. That creates your first execution in Runtime.
    </div>
  );
}
