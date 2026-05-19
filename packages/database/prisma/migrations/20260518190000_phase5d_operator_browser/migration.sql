-- Phase 5D — operator observe/join/takeover leases + opaque browser-feed room tokens.

CREATE TYPE "BrowserOperatorMode" AS ENUM ('none', 'observe', 'join', 'takeover');

ALTER TABLE "BrowserSession" ADD COLUMN "operatorMode" "BrowserOperatorMode" NOT NULL DEFAULT 'none';
ALTER TABLE "BrowserSession" ADD COLUMN "operatorUserId" TEXT;
ALTER TABLE "BrowserSession" ADD COLUMN "operatorLeaseExpiresAt" TIMESTAMP(3);
ALTER TABLE "BrowserSession" ADD COLUMN "takeoverUserId" TEXT;
ALTER TABLE "BrowserSession" ADD COLUMN "takeoverLeaseExpiresAt" TIMESTAMP(3);
ALTER TABLE "BrowserSession" ADD COLUMN "operatorFeedRoomToken" TEXT;
ALTER TABLE "BrowserSession" ADD COLUMN "operatorFeedLastEmittedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "BrowserSession_operatorFeedRoomToken_key" ON "BrowserSession"("operatorFeedRoomToken");

CREATE INDEX "BrowserSession_tenantId_operatorLeaseExpiresAt_idx" ON "BrowserSession"("tenantId", "operatorLeaseExpiresAt");

CREATE INDEX "BrowserSession_tenantId_takeoverLeaseExpiresAt_idx" ON "BrowserSession"("tenantId", "takeoverLeaseExpiresAt");
