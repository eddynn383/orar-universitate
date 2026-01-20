-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'REJECTED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'STUDENT';

-- AlterTable
ALTER TABLE "events" ADD COLUMN "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN "approvedById" TEXT,
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "publishedById" TEXT,
ADD COLUMN "publishedAt" TIMESTAMP(3),
ADD COLUMN "rejectionReason" TEXT;

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
