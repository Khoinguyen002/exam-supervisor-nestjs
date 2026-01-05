import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from 'src/users/users.service';
import { compareToken, hashToken } from 'src/common/helper/token';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  private async issueTokens(userId: string) {
    const payload = { sub: userId };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    await this.usersService.update(userId, {
      refreshToken: hashToken(refreshToken),
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async register(dto: RegisterDto) {
    const newUser = await this.usersService.create({
      ...dto,
      refreshToken: null,
    });
    return this.issueTokens(newUser.id);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.getByEmail(dto.email);

    if (!user || !compareToken(dto.password, user.password)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user.id);
  }

  async refreshToken(user: User, refreshToken: string | null) {
    if (!user || !user.refreshToken || !refreshToken) {
      throw new UnauthorizedException();
    }

    const isValid = compareToken(refreshToken, user.refreshToken);

    if (!isValid) {
      throw new UnauthorizedException();
    }

    return this.issueTokens(user.id);
  }

  async logout(userId: string) {
    await this.usersService.update(userId, {
      refreshToken: null,
    });
  }
}
