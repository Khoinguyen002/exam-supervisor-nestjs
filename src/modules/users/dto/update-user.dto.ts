import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional } from 'class-validator';

export class UpdateUserDto extends OmitType(PartialType(CreateUserDto), [
  'password',
]) {
  @IsOptional()
  refreshToken?: string | null;
}
