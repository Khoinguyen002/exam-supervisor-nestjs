import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from 'src/modules/users/users.service';
import { compareToken, hashToken } from 'src/common/helper/token';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  private async issueTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    await this.usersService.update(user.id, {
      refreshToken: hashToken(refreshToken),
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async register(dto: RegisterDto) {
    const newUser = await this.usersService.create(dto);
    return this.issueTokens(newUser);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.getByEmail(dto.email);

    if (!user || !compareToken(dto.password, user.password)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user);
  }

  async refreshToken(refreshToken: string | null) {
    if (!refreshToken) {
      throw new UnauthorizedException();
    }

    const payload = await this.jwtService.verifyAsync(refreshToken);

    const user = await this.usersService.getById(payload.sub);

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException();
    }

    const isValid = compareToken(refreshToken, user.refreshToken);

    if (!isValid) {
      throw new UnauthorizedException();
    }

    return this.issueTokens(user);
  }

  async logout(userId: string) {
    await this.usersService.update(userId, {
      refreshToken: null,
    });
  }
}
