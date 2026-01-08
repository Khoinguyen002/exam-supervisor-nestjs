import {
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateExamDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsInt()
  duration: number; // minutes

  @IsInt()
  passScore: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  assignees?: string[] = []; // List of email addresses assigned to take this exam
}
