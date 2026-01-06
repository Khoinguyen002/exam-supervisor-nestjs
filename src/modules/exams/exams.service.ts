import { Injectable, NotFoundException, Patch } from '@nestjs/common';
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
        ...dto,
        createdById: userId,
      },
    });
  }

  async findAll({ page = 1, limit = 10 }: PaginationQueryDto) {
    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.exam.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.exam.count(),
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

    return this.prisma.exam.update({
      where: { id },
      data: { ...dto, updatedById: author.id },
    });
  }

  async publish(id: string) {
    const exam = await this.prisma.exam.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    });

    this.eventEmitter.emit('exam.published', {
      examId: exam.id,
      title: exam.title,
    });
    return exam;
  }

  unPublish(id: string) {
    return this.prisma.exam.update({
      where: { id },
      data: { status: 'DRAFT' },
    });
  }
}
