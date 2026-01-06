-- DropForeignKey
ALTER TABLE "Exam" DROP CONSTRAINT "Exam_updatedById_fkey";

-- AlterTable
ALTER TABLE "Exam" ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
