import { Module } from '@nestjs/common';
import { ExamAttemptsService } from './exam-attempts.service';
import { ExamAttemptsController } from './exam-attempts.controller';

@Module({
  controllers: [ExamAttemptsController],
  providers: [ExamAttemptsService],
})
export class ExamAttemptsModule {}
