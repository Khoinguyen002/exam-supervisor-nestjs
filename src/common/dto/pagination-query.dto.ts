import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  Min,
  IsString,
  IsEnum,
  IsDateString,
} from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'RUNNING', 'ENDED', 'ARCHIVED'])
  status?: 'DRAFT' | 'PUBLISHED' | 'RUNNING' | 'ENDED' | 'ARCHIVED';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  createdBy?: string;
}
