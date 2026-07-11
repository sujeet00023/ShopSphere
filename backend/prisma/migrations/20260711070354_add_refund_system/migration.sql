-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('NONE', 'REQUESTED', 'APPROVED', 'REJECTED', 'REFUNDED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "refundAmount" DOUBLE PRECISION,
ADD COLUMN     "refundReason" TEXT,
ADD COLUMN     "refundRequestedAt" TIMESTAMP(3),
ADD COLUMN     "refundStatus" "RefundStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "refundedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "RefundHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefundHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RefundHistory_orderId_idx" ON "RefundHistory"("orderId");

-- CreateIndex
CREATE INDEX "Order_refundStatus_idx" ON "Order"("refundStatus");

-- AddForeignKey
ALTER TABLE "RefundHistory" ADD CONSTRAINT "RefundHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
