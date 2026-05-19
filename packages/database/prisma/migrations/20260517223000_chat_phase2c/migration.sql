-- CreateEnum
CREATE TYPE "MessageDeliveryStatus" AS ENUM ('complete', 'streaming', 'partial', 'failed');

-- AlterTable ChatSession
ALTER TABLE "ChatSession" ADD COLUMN "assistantId" TEXT,
ADD COLUMN "channelId" TEXT,
ADD COLUMN "visitorKey" TEXT,
ADD COLUMN "metadata" JSONB,
ADD COLUMN "archivedAt" TIMESTAMP(3);

-- AlterTable Message
ALTER TABLE "Message" ADD COLUMN "deliveryStatus" "MessageDeliveryStatus" NOT NULL DEFAULT 'complete',
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Message" SET "updatedAt" = "createdAt";

-- CreateIndex
CREATE INDEX "ChatSession_tenantId_archivedAt_idx" ON "ChatSession"("tenantId", "archivedAt");

CREATE INDEX "ChatSession_tenantId_visitorKey_idx" ON "ChatSession"("tenantId", "visitorKey");

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "Assistant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
