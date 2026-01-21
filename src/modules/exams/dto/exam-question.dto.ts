import { IsInt, IsOptional, IsString } from 'class-validator';

export class ExamQuestionDto {
  @IsString()
  questionId: string;

  @IsInt()
  score: number;

  @IsInt()
  @IsOptional()
  order?: number;
}
