import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { User } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Injectable()
export class ExamsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(userId: string, dto: CreateExamDto) {
    const { questions, ...examData } = dto;

    const exam = await this.prisma.exam.create({
      data: {
        title: examData.title,
        description: examData.description,
        passScore: examData.passScore,
        assignees: examData.assignees || [],
        startAt: examData.startAt ? new Date(examData.startAt) : undefined,
        endAt: examData.endAt ? new Date(examData.endAt) : undefined,
        createdById: userId,
      },
    });

    // Handle questions creation if provided
    if (questions && questions.length > 0) {
      // Validate that all questions exist
      const questionIds = questions.map((q) => q.questionId);
      const existingQuestions = await this.prisma.question.findMany({
        where: {
          id: { in: questionIds },
        },
        select: { id: true },
      });

      const existingQuestionIds = new Set(existingQuestions.map((q) => q.id));
      const invalidQuestionIds = questionIds.filter(
        (id) => !existingQuestionIds.has(id),
      );

      if (invalidQuestionIds.length > 0) {
        throw new BadRequestException(
          `Invalid question IDs: ${invalidQuestionIds.join(', ')}`,
        );
      }

      // Create exam-question relationships
      for (const question of questions) {
        await this.prisma.examQuestion.create({
          data: {
            examId: exam.id,
            questionId: question.questionId,
            score: question.score,
            order: question.order || 0,
          },
        });
      }
    }

    return exam;
  }

  async duplicate(id: string, user: User) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        questions: true,
      },
    });

    if (!exam) throw new NotFoundException('Exam not found');

    // Authorization check
    if (user.role !== 'ADMIN' && exam.createdById !== user.id) {
      throw new ForbiddenException(
        'Only admin or exam creator can duplicate exam',
      );
    }

    // Create new exam with copied data
    const duplicatedExam = await this.prisma.exam.create({
      data: {
        title: `${exam.title} (Copy)`,
        description: exam.description,
        passScore: exam.passScore,
        assignees: [...exam.assignees],
        startAt: null, // Reset schedule for new exam
        endAt: null,
        status: 'DRAFT', // New exam starts as draft
        createdById: user.id,
      },
    });

    // Copy exam-question relationships (reuse existing questions)
    for (const examQuestion of exam.questions) {
      await this.prisma.examQuestion.create({
        data: {
          examId: duplicatedExam.id,
          questionId: examQuestion.questionId,
          order: examQuestion.order,
          score: examQuestion.score,
        },
      });
    }

    return duplicatedExam;
  }

  async findAll(
    user: User,
    {
      page = 1,
      limit = 10,
      title,
      status,
      startDate,
      endDate,
      createdBy,
    }: PaginationQueryDto,
  ) {
    const skip = (page - 1) * limit;

    // Build where clause based on user role and filters
    const where: any = user.role === 'ADMIN' ? {} : { createdById: user.id };

    // Add filters
    if (title) {
      where.title = {
        contains: title,
        mode: 'insensitive',
      };
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (createdBy) {
      where.createdBy = {
        email: {
          contains: createdBy,
          mode: 'insensitive',
        },
      };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.exam.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          questions: { include: { question: { include: { options: true } } } },
          createdBy: { select: { email: true } },
        },
      }),
      this.prisma.exam.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, dto: UpdateExamDto, author: User) {
    const exam = await this.prisma.exam.findUnique({ where: { id } });
    if (!exam) throw new NotFoundException('Exam not found');

    // Prevent editing ended exams
    if (exam.status === 'ENDED') {
      throw new BadRequestException('Cannot edit an exam that has ended');
    }

    const { questions, ...examData } = dto;

    const updatedExam = await this.prisma.exam.update({
      where: { id },
      data: {
        ...examData,
        updatedById: author.id,
        startAt: dto.startAt ? new Date(dto.startAt) : exam.startAt,
        endAt: dto.endAt ? new Date(dto.endAt) : exam.endAt,
      },
    });

    // Handle questions update if provided
    if (questions !== undefined) {
      // Get existing questions for this exam
      const existingQuestions = await this.prisma.examQuestion.findMany({
        where: { examId: id },
        select: { examId: true, questionId: true, order: true },
      });

      const existingQuestionIds = new Set(
        existingQuestions.map((eq) => eq.questionId),
      );
      const providedQuestionIds = new Set(questions.map((q) => q.questionId));

      // Delete questions that are no longer in the provided list
      const questionsToDelete = existingQuestions.filter(
        (eq) => !providedQuestionIds.has(eq.questionId),
      );

      if (questionsToDelete.length > 0) {
        await this.prisma.examQuestion.deleteMany({
          where: {
            OR: questionsToDelete.map((eq) => ({
              examId: eq.examId,
              questionId: eq.questionId,
            })),
          },
        });
      }

      // Create or update questions
      for (const question of questions) {
        if (existingQuestionIds.has(question.questionId)) {
          // Update existing question
          await this.prisma.examQuestion.update({
            where: {
              examId_questionId: {
                examId: id,
                questionId: question.questionId,
              },
            },
            data: {
              score: question.score,
              order: question.order,
            },
          });
        } else {
          // Create new question association
          await this.prisma.examQuestion.create({
            data: {
              examId: id,
              questionId: question.questionId,
              score: question.score,
              order: question.order,
            },
          });
        }
      }
    }

    return updatedExam;
  }

  async publish(id: string, user: User) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: { questions: true },
    });

    if (!exam) throw new NotFoundException('Exam not found');

    // Authorization check
    if (user.role !== 'ADMIN' && exam.createdById !== user.id) {
      throw new ForbiddenException('Only admin or exam creator can publish');
    }

    // Validation: exam must have questions
    if (exam.questions.length === 0) {
      throw new BadRequestException(
        'Exam must have at least one question to be published',
      );
    }

    // Validation: can only publish from DRAFT
    if (exam.status !== 'DRAFT') {
      throw new BadRequestException(
        `Cannot publish exam with status ${exam.status}`,
      );
    }

    const updatedExam = await this.prisma.exam.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    });

    this.eventEmitter.emit('exam.published', {
      examId: updatedExam.id,
      title: updatedExam.title,
    });
    return updatedExam;
  }

  async unPublish(id: string, user: User) {
    const exam = await this.prisma.exam.findUnique({ where: { id } });
    if (!exam) throw new NotFoundException('Exam not found');

    // Authorization check
    if (user.role !== 'ADMIN' && exam.createdById !== user.id) {
      throw new ForbiddenException('Only admin or exam creator can unpublish');
    }

    // Validation: can only unpublish from PUBLISHED
    if (exam.status !== 'PUBLISHED') {
      throw new BadRequestException(
        `Cannot unpublish exam with status ${exam.status}`,
      );
    }

    return this.prisma.exam.update({
      where: { id },
      data: { status: 'DRAFT' },
    });
  }

  async archive(id: string, user: User) {
    const exam = await this.prisma.exam.findUnique({ where: { id } });
    if (!exam) throw new NotFoundException('Exam not found');

    // Authorization check
    if (user.role !== 'ADMIN' && exam.createdById !== user.id) {
      throw new ForbiddenException('Only admin or exam creator can archive');
    }

    // Validation: can only archive from ENDED
    if (exam.status !== 'ENDED') {
      throw new BadRequestException(
        `Cannot archive exam with status ${exam.status}`,
      );
    }

    return this.prisma.exam.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }

  async remove(id: string, user: User) {
    const exam = await this.prisma.exam.findUnique({ where: { id } });
    if (!exam) throw new NotFoundException('Exam not found');

    // Authorization check
    if (user.role !== 'ADMIN' && exam.createdById !== user.id) {
      throw new ForbiddenException(
        'Only admin or exam creator can delete exam',
      );
    }

    // Validation: can only delete from DRAFT or ARCHIVED
    if (!['DRAFT', 'ARCHIVED'].includes(exam.status)) {
      throw new BadRequestException(
        `Cannot delete exam with status ${exam.status}`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.examQuestion.deleteMany({
        where: { examId: id },
      }),
      this.prisma.examAttempt.deleteMany({
        where: { examId: id },
      }),
      this.prisma.exam.delete({
        where: { id },
      }),
    ]);

    return 'success';
  }

  // System method to automatically transition states based on time
  async checkAndUpdateExamStates() {
    const now = new Date();

    // PUBLISHED -> RUNNING when startAt is reached
    await this.prisma.exam.updateMany({
      where: {
        status: 'PUBLISHED',
        startAt: { lte: now },
      },
      data: { status: 'RUNNING' },
    });

    // RUNNING -> ENDED when endAt is reached
    await this.prisma.exam.updateMany({
      where: {
        status: 'RUNNING',
        endAt: { lte: now },
      },
      data: { status: 'ENDED' },
    });
  }

  getStatuses() {
    // Return the enum values as defined in the schema
    return [
      { value: 'DRAFT', label: 'Draft' },
      { value: 'PUBLISHED', label: 'Published' },
      { value: 'RUNNING', label: 'Running' },
      { value: 'ENDED', label: 'Ended' },
      { value: 'ARCHIVED', label: 'Archived' },
    ];
  }

  async getExamAttempts(
    examId: string,
    { page = 1, limit = 10 }: PaginationQueryDto,
    user: User,
  ) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Authorization check
    if (user.role !== 'ADMIN' && exam.createdById !== user.id) {
      throw new ForbiddenException(
        'Only admin or exam creator can view attempts',
      );
    }

    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.examAttempt.findMany({
        where: { examId },
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
          questions: {
            include: {
              options: true,
            },
            orderBy: { order: 'asc' },
          },
          answers: true,
        },
      }),
      this.prisma.examAttempt.count({
        where: { examId },
      }),
    ]);

    // Transform the data to include detailed question/answer information
    const transformedItems = items.map((attempt: any) => {
      const answersMap = new Map(
        attempt.answers.map((a: any) => [a.questionId, a.optionId]),
      );

      const questionsWithAnswers = attempt.questions.map((q) => {
        const selectedOptionId = answersMap.get(q.questionId);
        const selectedOption = selectedOptionId
          ? q.options.find((opt) => opt.id === selectedOptionId) || null
          : null;
        const isCorrect = selectedOption?.isCorrect || false;

        return {
          id: q.id,
          questionId: q.questionId,
          order: q.order,
          score: q.score,
          content: q.content,
          selectedOption: selectedOption
            ? {
                id: selectedOption.id,
                content: selectedOption.content,
                isCorrect: selectedOption.isCorrect,
              }
            : null,
          isCorrect,
          allOptions: q.options.map((opt) => ({
            id: opt.id,
            content: opt.content,
            isCorrect: opt.isCorrect,
          })),
        };
      });

      return {
        ...attempt,
        questions: questionsWithAnswers,
      };
    });

    return {
      items: transformedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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
}
