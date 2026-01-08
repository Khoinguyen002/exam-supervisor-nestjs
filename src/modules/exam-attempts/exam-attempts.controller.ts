import { Controller, Get, Param, Post, Query, Body } from '@nestjs/common';
import { User } from '../../common/decorators/user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiListResponse } from 'src/common/decorators/api-list-response.decorator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SubmitExamDto } from './dto/submit-exam.dto';
import { ExamAttemptsService } from './exam-attempts.service';

@Controller('candidate/exams')
@Roles('CANDIDATE')
export class ExamAttemptsController {
  constructor(private readonly service: ExamAttemptsService) {}

  // 0️⃣ Get assigned exams
  @Get()
  @ApiListResponse('Get assigned exams')
  getAssignedExams(
    @User('id') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.getAssignedExams(userId, query);
  }

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
