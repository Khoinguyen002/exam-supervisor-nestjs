import { Module } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { ExamListener } from './listeners/exam.listener';
import { ExamSchedulerService } from './exam-scheduler.service';
import { ExamAttemptsModule } from '../exam-attempts/exam-attempts.module';

@Module({
  imports: [ExamAttemptsModule],
  controllers: [ExamsController],
  providers: [ExamsService, ExamListener, ExamSchedulerService],
})
export class ExamsModule {}
