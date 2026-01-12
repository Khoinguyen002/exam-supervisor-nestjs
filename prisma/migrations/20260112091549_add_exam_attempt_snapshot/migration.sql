-- AlterTable
ALTER TABLE "ExamAttempt" ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "endAt" TIMESTAMP(3),
ADD COLUMN     "examDescription" TEXT,
ADD COLUMN     "examTitle" TEXT,
ADD COLUMN     "passScore" INTEGER,
ADD COLUMN     "startAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ExamAttemptQuestion" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER,
    "score" DOUBLE PRECISION DEFAULT 1,
    "content" TEXT NOT NULL,

    CONSTRAINT "ExamAttemptQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamAttemptOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ExamAttemptOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExamAttemptQuestion_attemptId_order_key" ON "ExamAttemptQuestion"("attemptId", "order");

-- AddForeignKey
ALTER TABLE "ExamAttemptQuestion" ADD CONSTRAINT "ExamAttemptQuestion_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttemptOption" ADD CONSTRAINT "ExamAttemptOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ExamAttemptQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
