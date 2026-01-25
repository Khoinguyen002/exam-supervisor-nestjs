/*
  Warnings:

  - You are about to drop the `AttemptAnswer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AttemptAnswer" DROP CONSTRAINT "AttemptAnswer_attemptId_fkey";

-- DropForeignKey
ALTER TABLE "AttemptAnswer" DROP CONSTRAINT "AttemptAnswer_questionId_fkey";

-- AlterTable
ALTER TABLE "ExamAttemptOption" ADD COLUMN     "isSelected" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "AttemptAnswer";
