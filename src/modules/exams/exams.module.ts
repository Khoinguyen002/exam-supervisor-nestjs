import { Module } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { ExamListener } from './listeners/exam.listener';

@Module({
  controllers: [ExamsController],
  providers: [ExamsService, ExamListener],
})
export class ExamsModule {}
