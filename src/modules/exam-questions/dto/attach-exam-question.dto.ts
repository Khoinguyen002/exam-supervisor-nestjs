import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class AttachExamQuestionDto {
  @IsString()
  questionId: string;

  @IsInt()
  @Min(1)
  order: number;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  score?: number;
}

export class AttachExamQuestionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachExamQuestionDto)
  questions: AttachExamQuestionDto[];
}
