import {
  BadRequestException,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SubmitExamDto } from './dto/submit-exam.dto';
import { User } from '@prisma/client';

@Injectable()
export class ExamAttemptsService {
  constructor(private prisma: PrismaService) {}

  async getAssignedExams(
    userId: string,
    { page = 1, limit = 10 }: PaginationQueryDto,
  ) {
    // First get the user to check their email
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const skip = (page - 1) * limit;

    // Find exams where the user's email is in the assignees list and exam is RUNNING (active)
    const [items, total] = await this.prisma.$transaction([
      this.prisma.exam.findMany({
        where: {
          status: 'RUNNING',
          assignees: {
            has: user.email,
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          passScore: true,
          createdAt: true,
          startAt: true,
          endAt: true,
          questions: true,
        },
      }),
      this.prisma.exam.count({
        where: {
          status: 'RUNNING',
          assignees: {
            has: user.email,
          },
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async startExam(userId: string, examId: string) {
    // First get the user to check their email
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!exam || exam.status !== 'RUNNING') {
      throw new BadRequestException('Exam not available');
    }

    // Check if user's email is in the assignees list
    if (exam.assignees.length > 0 && !exam.assignees.includes(user.email)) {
      throw new BadRequestException('You are not assigned to take this exam');
    }

    return this.prisma.$transaction(async (tx) => {
      const attempt = await tx.examAttempt.upsert({
        where: {
          userId_examId: { userId, examId },
        },
        update: {
          status: 'IN_PROGRESS', // Transition from CREATED to IN_PROGRESS
          // Update snapshot if it doesn't exist
          examTitle: exam.title,
          examDescription: exam.description,
          passScore: exam.passScore,
          startAt: exam.startAt,
          endAt: exam.endAt,
        },
        create: {
          userId,
          examId,
          status: 'IN_PROGRESS',
          // Create snapshot
          examTitle: exam.title,
          examDescription: exam.description,
          passScore: exam.passScore,
          startAt: exam.startAt,
          endAt: exam.endAt,
        },
        include: {
          questions: true,
        },
      });

      // Check if attempt was already terminated
      if (attempt.status === 'TERMINATED') {
        throw new BadRequestException('Exam attempt has been terminated');
      }

      // If this is the first time starting the exam, create question snapshots
      if (attempt.questions.length === 0) {
        const questionSnapshots = exam.questions.map((eq) => ({
          attemptId: attempt.id,
          questionId: eq.questionId,
          order: eq.order,
          score: eq.score,
          content: eq.question.content,
        }));

        await tx.examAttemptQuestion.createMany({
          data: questionSnapshots,
        });

        // Create option snapshots for each question
        for (const eq of exam.questions) {
          const optionSnapshots = eq.question.options.map((option) => ({
            questionId: eq.questionId, // This should be the attempt question id, but we need to get it
            content: option.content,
            isCorrect: option.isCorrect,
          }));

          // Get the created attempt question to link options
          const attemptQuestion = await tx.examAttemptQuestion.findFirst({
            where: {
              attemptId: attempt.id,
              questionId: eq.questionId,
            },
          });

          if (attemptQuestion) {
            const optionsWithQuestionId = optionSnapshots.map((opt) => ({
              ...opt,
              questionId: attemptQuestion.id,
            }));
            await tx.examAttemptOption.createMany({
              data: optionsWithQuestionId,
            });
          }
        }
      }

      // Return data with snapshot
      const attemptWithSnapshot = await tx.examAttempt.findUnique({
        where: { id: attempt.id },
        include: {
          questions: {
            include: {
              options: true,
            },
            orderBy: { order: 'asc' },
          },
        },
      });

      return {
        attemptId: attempt.id,
        exam: {
          id: exam.id,
          title: attempt.examTitle,
          description: attempt.examDescription,
          passScore: attempt.passScore,
          startAt: attempt.startAt,
          endAt: attempt.endAt,
          questions: attemptWithSnapshot?.questions.map((q) => ({
            id: q.id,
            content: q.content,
            options: q.options.map((opt) => ({
              id: opt.id,
              content: opt.content,
            })),
          })),
        },
      };
    });
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
          status: 'SUBMITTED',
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

  async terminateAttempt(attemptId: string, user: User) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { exam: true },
    });

    if (!attempt) {
      throw new BadRequestException('Attempt not found');
    }

    // Authorization check
    if (user.role !== 'ADMIN' && attempt.exam.createdById !== user.id) {
      throw new ForbiddenException(
        'Only admin or exam creator can terminate attempts',
      );
    }

    // Validation: can only terminate IN_PROGRESS attempts
    if (attempt.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        `Cannot terminate attempt with status ${attempt.status}`,
      );
    }

    return this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'TERMINATED',
        finishedAt: new Date(),
      },
    });
  }

  // System method to auto-submit expired attempts
  async checkAndAutoSubmitExpiredAttempts() {
    const now = new Date();

    // Find all IN_PROGRESS attempts where exam has ended
    const expiredAttempts = await this.prisma.examAttempt.findMany({
      where: {
        status: 'IN_PROGRESS',
        exam: {
          endAt: { lte: now },
        },
      },
      include: {
        exam: {
          include: {
            questions: true,
          },
        },
      },
    });

    // Auto-submit each expired attempt with empty answers (score = 0)
    for (const attempt of expiredAttempts) {
      await this.prisma.examAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'SUBMITTED',
          score: 0, // No answers provided, so score is 0
          finishedAt: new Date(),
        },
      });
    }

    return expiredAttempts.length;
  }
}
