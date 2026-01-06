import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { AttachQuestionDto } from './dto/attach-question.dto';
import { UpdateExamQuestionsDto } from './dto/update-exam-question.dto';

@Injectable()
export class ExamQuestionsService {
  constructor(private prisma: PrismaService) {}
  async attachQuestion(examId: string, dto: AttachQuestionDto) {
    return this.prisma.examQuestion.create({
      data: {
        examId,
        questionId: dto.questionId,
        order: dto.order,
        score: dto.score ?? 1,
      },
    });
  }

  async listQuestions(examId: string) {
    const items = await this.prisma.examQuestion.findMany({
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

      for (const q of dto.questions) {
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

      return this.listQuestions(examId);
    });
  }

  async detachQuestion(examId: string, questionId: string) {
    return this.prisma.examQuestion.delete({
      where: {
        examId_questionId: {
          examId,
          questionId,
        },
      },
    });
  }
}
