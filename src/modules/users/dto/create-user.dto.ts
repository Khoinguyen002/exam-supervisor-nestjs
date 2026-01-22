import { Optional } from '@nestjs/common';
import { Role } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @Optional()
  @IsEnum(Role)
  role: Role = 'CANDIDATE';
}
