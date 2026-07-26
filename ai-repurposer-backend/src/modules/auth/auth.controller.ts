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
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { clearAuthCookies, setAuthCookies } from './cookies';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 registrations per minute
  register(@Body() body: RegisterDto) {
    // Returns a message, not a session — the address must be verified first.
    return this.authService.register(body.email, body.password, body.name);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 login attempts per minute
  @HttpCode(200)
  @UseGuards(AuthGuard('local'))
  async login(
    @Body() _body: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as { id: string; email: string };
    const tokens = await this.authService.login(user.id, user.email);
    setAuthCookies(res, tokens);
    return { id: user.id, email: user.email };
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as {
      sub: string;
      email: string;
      refreshToken: string;
    };
    const tokens = await this.authService.refresh(
      user.sub,
      user.email,
      user.refreshToken,
    );
    setAuthCookies(res, tokens);
    return { id: user.sub, email: user.email };
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as { id: string };
    const result = await this.authService.logout(user.id);
    clearAuthCookies(res);
    return result;
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

    // Cookies are set server-side rather than passed as query parameters,
    // which would leak the tokens into browser history and Referer headers.
    setAuthCookies(res, tokens);

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback`);
  }

  // ── Email Verification ────────────────────────────────
  // Token-guessing surface. The tokens are 256-bit random, so a limit is not
  // what makes guessing infeasible — but an unlimited unauthenticated endpoint
  // is still free load, and this one hits the database on every call.
  @Post('verify-email')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 attempts per minute
  async verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body.token);
  }

  @Post('resend-verification')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  async resendVerification(@Body() body: ResendVerificationDto) {
    return this.authService.resendVerification(body.email);
  }

  // ── Password Reset ────────────────────────────────────
  @Post('request-password-reset')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  async requestPasswordReset(@Body() body: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(body.email);
  }

  // The only endpoint that changes a password without proving the old one, and
  // it was the sole auth route with no limit at all.
  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.password);
  }
}
