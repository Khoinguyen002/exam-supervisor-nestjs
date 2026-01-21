import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsArray, IsOptional } from 'class-validator';
import { CreateExamDto } from './create-exam.dto';
import { ExamQuestionDto } from './exam-question.dto';

export class UpdateExamDto extends PartialType(CreateExamDto) {
  @IsArray()
  @Type(() => ExamQuestionDto)
  @IsOptional()
  questions?: ExamQuestionDto[];
}
