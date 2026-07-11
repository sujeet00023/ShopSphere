/*
  Warnings:

  - You are about to drop the column `note` on the `RefundHistory` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "RefundStatus" ADD VALUE 'PROCESSING';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cancelledAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "RefundHistory" DROP COLUMN "note",
ADD COLUMN     "remarks" TEXT;

-- CreateIndex
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");
