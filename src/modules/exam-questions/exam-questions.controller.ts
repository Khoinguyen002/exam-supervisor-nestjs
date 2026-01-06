import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ExamQuestionsService } from './exam-questions.service';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { AttachQuestionDto } from './dto/attach-question.dto';
import { ApiListResponse } from 'src/common/decorators/api-list-response.decorator';
import { UpdateExamQuestionsDto } from './dto/update-exam-question.dto';

@Roles('ADMIN', 'EXAMINER')
@Controller('admin/exams/:examId/questions')
export class ExamQuestionsController {
  constructor(private readonly service: ExamQuestionsService) {}

  @Post()
  attach(@Param('examId') examId: string, @Body() dto: AttachQuestionDto) {
    return this.service.attachQuestion(examId, dto);
  }

  @ApiListResponse('Get exam questions')
  @Get()
  list(@Param('examId') examId: string) {
    return this.service.listQuestions(examId);
  }

  @Patch()
  update(@Param('examId') examId: string, @Body() dto: UpdateExamQuestionsDto) {
    return this.service.updateQuestions(examId, dto);
  }

  @Delete(':questionId')
  detach(
    @Param('examId') examId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.service.detachQuestion(examId, questionId);
  }
}
