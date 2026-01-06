import { Exclude } from 'class-transformer';
import { UpdateUserDto } from './update-user.dto';

export class UserResponseDto extends UpdateUserDto {
  @Exclude()
  password: string;

  @Exclude()
  refreshToken: string;
}
