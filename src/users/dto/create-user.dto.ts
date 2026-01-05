import { Optional } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { IsEmail, IsEnum, IsString } from 'class-validator';

export class CreateUserDto implements Omit<
  User,
  'password' | 'id' | 'createdAt'
> {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @Optional()
  @IsEnum(Role)
  role: Role = 'CANDIDATE';

  @Optional()
  refreshToken: string | null;
}
