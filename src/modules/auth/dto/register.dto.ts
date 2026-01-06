import { PickType } from '@nestjs/mapped-types';
import { CreateUserDto } from 'src/modules/users/dto/create-user.dto';

export class RegisterDto extends PickType(CreateUserDto, [
  'email',
  'password',
  'role',
]) {}
