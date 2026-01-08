import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiListResponse } from 'src/common/decorators/api-list-response.decorator';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { UpdateExamQuestionsDto } from './dto/update-exam-question.dto';
import { ExamQuestionsService } from './exam-questions.service';

@Roles('ADMIN', 'EXAMINER')
@Controller('admin/exams/:examId/questions')
export class ExamQuestionsController {
  constructor(private readonly service: ExamQuestionsService) {}

  @ApiListResponse('Get exam questions')
  @Get()
  list(@Param('examId') examId: string) {
    return this.service.listQuestions(examId);
  }

  @Patch()
  update(@Param('examId') examId: string, @Body() dto: UpdateExamQuestionsDto) {
    return this.service.updateQuestions(examId, dto);
  }
}
