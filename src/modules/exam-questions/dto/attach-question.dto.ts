import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AttachQuestionDto {
  @IsString()
  questionId: string;

  @IsInt()
  @Min(1)
  order: number;

  @IsOptional()
  @IsInt()
  score?: number;
}
