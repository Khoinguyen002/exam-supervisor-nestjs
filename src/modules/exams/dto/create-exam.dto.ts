import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateExamDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsInt()
  duration: number; // minutes

  @IsInt()
  passScore: number;

  @IsString()
  description?: string;
}
