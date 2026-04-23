import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  Get,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 registrations per minute
  register(@Body() body: { email: string; password: string; name?: string }) {
    return this.authService.register(body.email, body.password, body.name);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 login attempts per minute
  @HttpCode(200)
  @UseGuards(AuthGuard('local'))
  login(@Req() req: Request) {
    const user = req.user as { id: string; email: string };
    return this.authService.login(user.id, user.email);
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  refresh(@Req() req: Request) {
    const user = req.user as {
      sub: string;
      email: string;
      refreshToken: string;
    };
    return this.authService.refresh(user.sub, user.email, user.refreshToken);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  logout(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.authService.logout(user.id);
  }

  // ── Google OAuth ──────────────────────────────────────
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const { googleId, email, name } = req.user as {
      googleId: string;
      email: string;
      name: string;
    };

    const tokens = await this.authService.googleLogin(googleId, email, name);

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3001';
    res.redirect(
      `${frontendUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
    );
  }
}
