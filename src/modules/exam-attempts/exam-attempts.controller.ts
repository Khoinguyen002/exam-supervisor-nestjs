import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Body,
  Patch,
} from '@nestjs/common';
import { User } from '../../common/decorators/user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiListResponse } from 'src/common/decorators/api-list-response.decorator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SubmitExamDto } from './dto/submit-exam.dto';
import { ExamAttemptsService } from './exam-attempts.service';
import type { User as UserModal } from '@prisma/client';

@Controller('candidate/exams')
export class ExamAttemptsController {
  constructor(private readonly service: ExamAttemptsService) {}

  // 0️⃣ Get assigned exams
  @Get()
  @Roles('CANDIDATE')
  @ApiListResponse('Get assigned exams')
  getAssignedExams(
    @User('id') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.getAssignedExams(userId, query);
  }

  // 1️⃣ Start exam
  @Post(':examId/start')
  @Roles('CANDIDATE')
  startExam(@User() user: UserModal, @Param('examId') examId: string) {
    return this.service.startExam(user, examId);
  }

  // 2️⃣ Submit exam
  @Post(':examId/submit')
  @Roles('CANDIDATE')
  submitExam(
    @User('id') userId: string,
    @Param('examId') examId: string,
    @Body() dto: SubmitExamDto,
  ) {
    return this.service.submitExam(userId, examId, dto);
  }

  // 3️⃣ Get result
  @Get(':examId/result')
  @Roles('CANDIDATE')
  getResult(@User('id') userId: string, @Param('examId') examId: string) {
    return this.service.getResult(userId, examId);
  }
}
