import { PartialType } from '@nestjs/mapped-types';
import { CreateOptionDto } from './create-option.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateOptionDto extends PartialType(CreateOptionDto) {
  @IsString()
  @IsOptional()
  id: string;

  @IsString()
  @IsOptional()
  questionId: string;
}
