import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from 'src/users/users.service';
import { comparePassword } from 'src/common/helper/password';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async register(dto: RegisterDto) {
    const newUser = await this.usersService.create(dto);
    return this.signToken(newUser.id);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.getByEmail(dto.email);

    if (!user || !comparePassword(dto.password, user.password)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.signToken(user.id);
  }

  private signToken(userId: string) {
    return {
      access_token: this.jwtService.sign({
        sub: userId,
      }),
    };
  }
}
