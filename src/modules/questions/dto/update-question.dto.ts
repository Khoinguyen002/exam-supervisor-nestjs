import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { UpdateOptionDto } from './update-option.dto';

export class UpdateQuestionDto {
  @IsString()
  @IsOptional()
  id: string;

  @IsString()
  updatedAt: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOptionDto)
  options: UpdateOptionDto[];
}
