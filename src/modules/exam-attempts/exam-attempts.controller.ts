import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { User } from '../../common/decorators/user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { SubmitExamDto } from './dto/submit-exam.dto';
import { ExamAttemptsService } from './exam-attempts.service';

@Controller('candidate/exams')
@Roles('CANDIDATE')
export class ExamAttemptsController {
  constructor(private readonly service: ExamAttemptsService) {}

  // 1️⃣ Start exam
  @Post(':examId/start')
  startExam(@User('id') userId: string, @Param('examId') examId: string) {
    return this.service.startExam(userId, examId);
  }

  // 2️⃣ Submit exam
  @Post(':examId/submit')
  submitExam(
    @User('id') userId: string,
    @Param('examId') examId: string,
    @Body() dto: SubmitExamDto,
  ) {
    return this.service.submitExam(userId, examId, dto);
  }

  // 3️⃣ Get result
  @Get(':examId/result')
  getResult(@User('id') userId: string, @Param('examId') examId: string) {
    return this.service.getResult(userId, examId);
  }
}
