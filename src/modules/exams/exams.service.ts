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

  create(userId: string, dto: CreateExamDto) {
    return this.prisma.exam.create({
      data: {
        title: dto.title,
        description: dto.description,
        passScore: dto.passScore,
        assignees: dto.assignees || [],
        startAt: dto.startAt ? new Date(dto.startAt) : undefined,
        endAt: dto.endAt ? new Date(dto.endAt) : undefined,
        createdById: userId,
      },
    });
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

  async findAll(user: User, { page = 1, limit = 10 }: PaginationQueryDto) {
    const skip = (page - 1) * limit;

    // Build where clause based on user role
    const where = user.role === 'ADMIN' ? {} : { createdById: user.id };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.exam.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          questions: { include: { question: { include: { options: true } } } },
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

    return this.prisma.exam.update({
      where: { id },
      data: {
        ...dto,
        updatedById: author.id,
        startAt: dto.startAt ? new Date(dto.startAt) : exam.startAt,
        endAt: dto.endAt ? new Date(dto.endAt) : exam.endAt,
      },
    });
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
}
