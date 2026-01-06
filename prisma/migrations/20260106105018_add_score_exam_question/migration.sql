/*
  Warnings:

  - A unique constraint covering the columns `[examId,order]` on the table `ExamQuestion` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ExamQuestion" ADD COLUMN     "score" INTEGER DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "ExamQuestion_examId_order_key" ON "ExamQuestion"("examId", "order");
