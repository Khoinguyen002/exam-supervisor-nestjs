import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';

export class SubmitAnswerDto {
  @IsString()
  questionId: string;

  @IsString()
  optionId: string;
}

export class SubmitExamDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerDto)
  answers: SubmitAnswerDto[];
}
