import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { UpdateOptionDto } from './dto/update-option.dto';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateQuestionDto) {
    const correctCount = dto.options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      throw new BadRequestException(
        'Each question must have exactly one correct option',
      );
    }

    return this.prisma.question.create({
      data: {
        content: dto.content,
        options: {
          create: dto.options.map((o) => ({
            content: o.content,
            isCorrect: o.isCorrect,
          })),
        },
      },
    });
  }

  async findAll(search?: string) {
    const items = await this.prisma.question.findMany({
      where: search
        ? { content: { contains: search, mode: 'insensitive' } }
        : undefined,
      include: { options: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      items,
      total: items.length,
    };
  }

  async findOne(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: { options: true },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return question;
  }

  async update(id: string, dto: UpdateQuestionDto) {
    return this.prisma.$transaction(async (tx) => {
      const question = await tx.question.findUnique({
        where: { id },
        include: {
          options: true,
          exams: {
            include: {
              exam: true,
            },
          },
        },
      });

      if (!question) {
        throw new NotFoundException('Question not found');
      }

      // Check if question is used in any running exams
      const runningExams = question.exams.filter(
        (eq) => eq.exam.status === 'RUNNING',
      );

      if (runningExams.length > 0) {
        throw new BadRequestException(
          'Cannot edit question that is part of a running exam',
        );
      }

      const existingOptions = question.options;
      const incomingOptions = dto.options ?? [];

      // 1️⃣ Validate correct count (trạng thái cuối)
      const correctCount = incomingOptions.filter((o) => o.isCorrect).length;
      if (correctCount !== 1) {
        throw new BadRequestException(
          'Each question must have exactly one correct option',
        );
      }

      // 🚫 Optimistic lock check
      if (new Date(dto.updatedAt).getTime() !== question.updatedAt?.getTime()) {
        throw new ConflictException(
          'Question has been modified by another user',
        );
      }

      // 2️⃣ Map option hiện tại theo id
      const existingMap = new Map(existingOptions.map((o) => [o.id, o]));

      // 3️⃣ Phân loại
      const toCreate: UpdateOptionDto[] = [];
      const toUpdate: UpdateOptionDto[] = [];
      const incomingIds = new Set<string>();

      for (const opt of incomingOptions) {
        if (opt.id && existingMap.has(opt.id)) {
          toUpdate.push(opt);
          incomingIds.add(opt.id);
        } else {
          toCreate.push(opt);
        }
      }

      const toDelete = existingOptions
        .filter((o) => !incomingIds.has(o.id))
        .map((o) => o.id);

      // 4️⃣ Update question content
      if (dto.content) {
        await tx.question.update({
          where: { id },
          data: { content: dto.content },
        });
      }

      // 5️⃣ Update options
      for (const opt of toUpdate) {
        await tx.option.update({
          where: {
            id_questionId: {
              id: opt.id,
              questionId: id,
            },
          },
          data: {
            content: opt.content,
            isCorrect: opt.isCorrect,
          },
        });
      }

      // 6️⃣ Create options
      if (toCreate.length) {
        await tx.option.createMany({
          data: toCreate.map((o) => ({
            questionId: id,
            content: o.content ?? '',
            isCorrect: o.isCorrect,
          })),
        });
      }

      // 7️⃣ Delete options
      if (toDelete.length) {
        await tx.option.deleteMany({
          where: {
            questionId: id,
            id: { in: toDelete },
          },
        });
      }

      return tx.question.findUnique({
        where: { id },
        include: { options: true },
      });
    });
  }

  async remove(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        exams: {
          include: {
            exam: true,
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Check if question is used in any running exams
    const runningExams = question.exams.filter(
      (eq) => eq.exam.status === 'RUNNING',
    );

    if (runningExams.length > 0) {
      throw new BadRequestException(
        'Cannot delete question that is part of a running exam',
      );
    }

    return this.prisma.question.delete({ where: { id } });
  }
}
