import { Optional } from '@nestjs/common';
import { Role } from '@prisma/client';
import { IsEmail, IsEnum, IsString } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @Optional()
  @IsEnum(Role)
  role?: Role;
}
