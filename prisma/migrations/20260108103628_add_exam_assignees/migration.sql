-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "assignees" TEXT[] DEFAULT ARRAY[]::TEXT[];
