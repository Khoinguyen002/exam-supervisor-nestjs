import { IsArray, ValidateNested } from 'class-validator';
import { AttachQuestionDto } from './attach-question.dto';
import { Type } from 'class-transformer';

export class UpdateExamQuestionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachQuestionDto)
  questions: AttachQuestionDto[];
}
