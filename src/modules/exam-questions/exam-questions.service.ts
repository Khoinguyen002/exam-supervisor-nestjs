import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { AttachExamQuestionDto } from './dto/attach-exam-question.dto';
import { UpdateExamQuestionsDto } from './dto/update-exam-question.dto';

@Injectable()
export class ExamQuestionsService {
  constructor(private prisma: PrismaService) {}

  async listQuestions(
    examId: string,
    prisma: PrismaService | Prisma.TransactionClient = this.prisma,
  ) {
    const items = await prisma.examQuestion.findMany({
      where: { examId },
      include: {
        question: {
          include: { options: true },
        },
      },
      orderBy: { order: 'asc' },
    });

    return {
      items,
      total: items.length,
    };
  }

  async updateQuestions(examId: string, dto: UpdateExamQuestionsDto) {
    return this.prisma.$transaction(async (tx) => {
      // validate duplicate order
      const orders = dto.questions.map((q) => q.order);
      if (new Set(orders).size !== orders.length) {
        throw new BadRequestException('Duplicate question order');
      }

      const existedQuestions = await tx.examQuestion.findMany({
        where: { examId },
        select: { questionId: true },
      });

      const toUpdateQuestions: AttachExamQuestionDto[] = [];
      const toAttachQuestions: AttachExamQuestionDto[] = [];

      for (const q of dto.questions) {
        if (
          existedQuestions.some(
            (existed) => existed.questionId === q.questionId,
          )
        ) {
          toUpdateQuestions.push(q);
        } else {
          toAttachQuestions.push(q);
        }
      }

      const toDeleteQuestions: string[] = existedQuestions
        .filter(
          (existed) =>
            !dto.questions.some((q) => q.questionId === existed.questionId),
        )
        .map((existed) => existed.questionId);

      for (const q of toUpdateQuestions) {
        await tx.examQuestion.update({
          where: {
            examId_questionId: {
              examId,
              questionId: q.questionId,
            },
          },
          data: {
            order: q.order,
            score: q.score,
          },
        });
      }

      for (const q of toAttachQuestions) {
        await tx.examQuestion.create({
          data: {
            examId,
            questionId: q.questionId,
            order: q.order,
            score: q.score ?? 1,
          },
        });
      }

      for (const q of toDeleteQuestions) {
        await tx.examQuestion.delete({
          where: {
            examId_questionId: {
              examId,
              questionId: q,
            },
          },
        });
      }

      return await this.listQuestions(examId, tx);
    });
  }
}
