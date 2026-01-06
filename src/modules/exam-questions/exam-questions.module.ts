import { Module } from '@nestjs/common';
import { ExamQuestionsService } from './exam-questions.service';
import { ExamQuestionsController } from './exam-questions.controller';

@Module({
  controllers: [ExamQuestionsController],
  providers: [ExamQuestionsService],
})
export class ExamQuestionsModule {}
