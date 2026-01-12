import {
  IsArray,
  IsDateString,
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
  passScore: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  assignees?: string[] = []; // List of email addresses assigned to take this exam

  @IsDateString()
  @IsOptional()
  startAt?: string;

  @IsDateString()
  @IsOptional()
  endAt?: string;
}
