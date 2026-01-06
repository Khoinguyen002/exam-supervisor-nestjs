import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitExamDto } from './dto/submit-exam.dto';

@Injectable()
export class ExamAttemptsService {
  constructor(private prisma: PrismaService) {}

  async startExam(userId: string, examId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          include: {
            question: {
              select: {
                options: {
                  select: {
                    content: true,
                    id: true,
                  },
                },
                id: true,
                content: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!exam || exam.status !== 'PUBLISHED') {
      throw new BadRequestException('Exam not available');
    }

    const attempt = await this.prisma.examAttempt.upsert({
      where: {
        userId_examId: { userId, examId },
      },
      update: {},
      create: {
        userId,
        examId,
      },
    });

    return {
      attemptId: attempt.id,
      exam,
    };
  }

  async submitExam(userId: string, examId: string, dto: SubmitExamDto) {
    return this.prisma.$transaction(async (tx) => {
      const uniqueQuestionIds = new Set(dto.answers.map((a) => a.questionId));

      if (uniqueQuestionIds.size !== dto.answers.length) {
        throw new BadRequestException('Duplicate answers detected');
      }

      const attempt = await tx.examAttempt.findUnique({
        where: { userId_examId: { userId, examId } },
        include: {
          exam: {
            include: {
              questions: true,
            },
          },
        },
      });

      if (!attempt) {
        throw new BadRequestException('Exam not started');
      }

      if (attempt.finishedAt) {
        throw new BadRequestException('Exam already submitted');
      }

      // Save answers
      await tx.attemptAnswer.createMany({
        data: dto.answers.map((a) => ({
          attemptId: attempt.id,
          questionId: a.questionId,
          optionId: a.optionId,
        })),
      });

      // Auto grading
      let score = 0;

      const validOptions = await tx.option.findMany({
        where: {
          OR: dto.answers.map((p) => ({
            id: p.optionId,
            questionId: p.questionId,
          })),
        },
      });

      const examQuestionsMap = new Map(
        attempt.exam.questions.map((q) => [q.questionId, q.score ?? 0]),
      );

      for (const so of validOptions) {
        const qScore = examQuestionsMap.get(so.questionId);
        if (so?.isCorrect && qScore) {
          score += qScore;
        }
      }

      return tx.examAttempt.update({
        where: { id: attempt.id },
        data: {
          score,
          finishedAt: new Date(),
        },
      });
    });
  }

  async getResult(userId: string, examId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { userId_examId: { userId, examId } },
      include: {
        exam: {
          include: {
            questions: {
              include: {
                question: {
                  include: { options: true },
                },
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt || !attempt.finishedAt) {
      throw new BadRequestException('Exam not completed');
    }

    const answersMap = new Map(
      attempt.answers.map((a) => [a.questionId, a.optionId]),
    );

    const questions = attempt.exam.questions.map((eq) => ({
      id: eq.questionId,
      content: eq.question.content,
      selectedOptionId: answersMap.get(eq.questionId),
      correctOptionId: eq.question.options.find((o) => o.isCorrect)?.id,
      isCorrect:
        answersMap.get(eq.questionId) ===
        eq.question.options.find((o) => o.isCorrect)?.id,
      score: eq.score,
    }));

    return {
      examId,
      score: attempt.score,
      pass: Number(attempt.score) >= attempt.exam.passScore,
      questions,
    };
  }
}
