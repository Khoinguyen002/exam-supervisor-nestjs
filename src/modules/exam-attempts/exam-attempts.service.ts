import {
  BadRequestException,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SubmitExamDto } from './dto/submit-exam.dto';
import type { User } from '@prisma/client';

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

    // Find exams where the user's email is in the assignees list and exam is RUNNING, PUBLISHED, or ENDED
    const [items, total] = await this.prisma.$transaction([
      this.prisma.exam.findMany({
        where: {
          status: {
            in: ['RUNNING', 'PUBLISHED', 'ENDED'],
          },
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
          status: true,
          questions: true,
        },
      }),
      this.prisma.exam.count({
        where: {
          status: {
            in: ['RUNNING', 'PUBLISHED', 'ENDED'],
          },
          assignees: {
            has: user.email,
          },
        },
      }),
    ]);

    // Get attempt information for each exam
    const examIds = items.map((exam) => exam.id);
    const attempts = await this.prisma.examAttempt.findMany({
      where: {
        userId,
        examId: { in: examIds },
      },
      select: {
        examId: true,
        status: true,
        finishedAt: true,
        score: true,
      },
    });

    // Create a map of examId to attempt info
    const attemptMap = new Map();
    attempts.forEach((attempt) => {
      attemptMap.set(attempt.examId, attempt);
    });

    // Add attempt status to each exam
    const itemsWithAttemptStatus = items.map((exam) => {
      const attempt = attemptMap.get(exam.id);
      let attemptStatus = 'NOT_ATTEMPTED';

      // For PUBLISHED exams, show as incoming/upcoming
      if (exam.status === 'PUBLISHED') {
        attemptStatus = 'UPCOMING';
      }
      // For ENDED exams, show as ended (regardless of attempt status)
      else if (exam.status === 'ENDED') {
        attemptStatus = 'ENDED';
      }
      // For RUNNING exams, check attempt status
      else if (exam.status === 'RUNNING') {
        if (attempt) {
          if (attempt.status === 'SUBMITTED' || attempt.finishedAt) {
            attemptStatus = 'COMPLETED';
          } else if (attempt.status === 'IN_PROGRESS') {
            attemptStatus = 'IN_PROGRESS';
          } else if (attempt.status === 'TERMINATED') {
            attemptStatus = 'TERMINATED';
          }
        }
      }

      return {
        ...exam,
        attemptStatus,
        attemptScore: attempt?.score || null,
      };
    });

    return {
      items: itemsWithAttemptStatus,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async startExam(user: User, examId: string) {
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
          userId_examId: { userId: user.id, examId },
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
          userId: user.id,
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

      // Check if attempt was already submitted
      if (attempt.status === 'SUBMITTED' || attempt.finishedAt) {
        throw new BadRequestException('Exam already submitted');
      }

      // Check if attempt was already terminated
      if (attempt.status === 'TERMINATED') {
        throw new BadRequestException('Exam attempt has been terminated');
      }

      // Return exam data directly from the original exam
      return {
        attemptId: attempt.id,
        exam: {
          id: exam.id,
          title: attempt.examTitle,
          description: attempt.examDescription,
          passScore: attempt.passScore,
          startAt: attempt.startAt,
          endAt: attempt.endAt,
          duration: attempt.duration,
          questions: exam.questions.map((eq) => ({
            questionId: eq.questionId,
            score: eq.score,
            order: eq.order,
            question: {
              id: eq.questionId,
              content: eq.question.content,
              tags: eq.question.tags,
              options: eq.question.options.map((opt) => ({
                id: opt.id,
                content: opt.content,
              })),
            },
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
          },
          questions: true,
        },
      });

      if (!attempt) {
        throw new BadRequestException('Exam not started');
      }

      if (attempt.finishedAt) {
        throw new BadRequestException('Exam already submitted');
      }

      // Create question and option snapshots if not already created
      if (attempt.questions.length === 0) {
        const questionSnapshots = attempt.exam.questions.map((eq) => ({
          attemptId: attempt.id,
          questionId: eq.questionId,
          order: eq.order,
          score: eq.score,
          content: eq.question.content,
          tags: eq.question.tags,
        }));

        await tx.examAttemptQuestion.createMany({
          data: questionSnapshots,
        });

        // Create option snapshots for each question
        for (const eq of attempt.exam.questions) {
          const optionSnapshots = eq.question.options.map((option) => ({
            content: option.content,
            isCorrect: option.isCorrect,
            originalOptionId: option.id,
            questionId: eq.questionId, // This will be updated after creating attempt questions
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

      // Save answers by setting isSelected on options
      for (const answer of dto.answers) {
        // Find the attempt question
        const attemptQuestion = await tx.examAttemptQuestion.findFirst({
          where: {
            attemptId: attempt.id,
            questionId: answer.questionId,
          },
        });

        if (!attemptQuestion) continue;

        // Reset all options for this question to not selected
        await tx.examAttemptOption.updateMany({
          where: {
            questionId: attemptQuestion.id,
          },
          data: {
            isSelected: false,
          },
        });

        // Set the selected option
        await tx.examAttemptOption.updateMany({
          where: {
            questionId: attemptQuestion.id,
            originalOptionId: answer.optionId,
          },
          data: {
            isSelected: true,
          },
        });
      }

      // Auto grading
      let score = 0;

      // Create a map of user answers for easier lookup
      const userAnswersMap = new Map(
        dto.answers.map((a) => [a.questionId, a.optionId]),
      );

      // Get all correct options for the questions in this exam
      const correctOptions = await tx.option.findMany({
        where: {
          questionId: {
            in: attempt.exam.questions.map((q) => q.questionId),
          },
          isCorrect: true,
        },
        select: {
          id: true,
          questionId: true,
        },
      });

      // Create exam questions score map
      const examQuestionsMap = new Map(
        attempt.exam.questions.map((q) => [q.questionId, q.score ?? 0]),
      );

      // Grade each question
      for (const correctOption of correctOptions) {
        const userSelectedOptionId = userAnswersMap.get(
          correctOption.questionId,
        );
        if (userSelectedOptionId === correctOption.id) {
          const qScore = examQuestionsMap.get(correctOption.questionId);
          if (qScore) {
            score += qScore;
          }
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
        questions: {
          include: {
            options: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!attempt || !attempt.finishedAt) {
      throw new BadRequestException('Exam not completed');
    }

    const questions = attempt.questions.map((q) => {
      const selectedOption = q.options.find((opt) => opt.isSelected);
      const correctOption = q.options.find((opt) => opt.isCorrect);

      return {
        id: q.questionId,
        content: q.content,
        tags: q.tags,
        selectedOptionId: selectedOption?.originalOptionId || null,
        selectedOptionContent: selectedOption?.content || null,
        correctOptionId: correctOption?.originalOptionId || null,
        correctOptionContent: correctOption?.content || null,
        isCorrect: selectedOption?.isCorrect || false,
        score: q.score,
      };
    });

    // Calculate total score from all questions
    const totalScore = attempt.questions.reduce(
      (sum, q) => sum + (q.score || 0),
      0,
    );

    return {
      examId,
      score: attempt.score,
      totalScore,
      pass: Number(attempt.score) >= (attempt.passScore || 0),
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
