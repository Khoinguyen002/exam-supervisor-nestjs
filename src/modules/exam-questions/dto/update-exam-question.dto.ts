import { IsArray, ValidateNested } from 'class-validator';
import { AttachExamQuestionDto } from './attach-exam-question.dto';
import { Type } from 'class-transformer';

export class UpdateExamQuestionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachExamQuestionDto)
  questions: AttachExamQuestionDto[];
}
