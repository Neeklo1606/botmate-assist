-- Phase 6B: accelerate stuck-tool scans (status START + createdAt) and control-plane aggregates.
CREATE INDEX "ToolInvocation_status_createdAt_idx" ON "ToolInvocation"("status", "createdAt");
