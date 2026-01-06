import { IsBoolean, IsString } from 'class-validator';

export class CreateOptionDto {
  @IsString()
  content: string;

  @IsBoolean()
  isCorrect: boolean;
}
