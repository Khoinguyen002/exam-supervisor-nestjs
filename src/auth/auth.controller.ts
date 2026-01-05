import { Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Body } from '@nestjs/common';
import { Public } from './decorators/public.decorator';
import { User } from './decorators/user.decorator';
import type { User as UserModal } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  refreshToken(
    @User() user: UserModal,
    @Body('refresh_token') refreshToken: string,
  ) {
    return this.authService.refreshToken(user, refreshToken);
  }
}
