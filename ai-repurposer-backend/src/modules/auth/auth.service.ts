import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { EmailService } from '@/modules/email/email.service';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL } from './cookies';

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly emailService: EmailService,
  ) {}

  // ── Register ──────────────────────────────────────────
  async register(email: string, password: string, name?: string) {
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(password, 12);
    const verificationToken = randomBytes(32).toString('hex');

    await this.prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: new Date(
          Date.now() + VERIFICATION_TOKEN_TTL_MS,
        ),
      },
    });

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(email, verificationToken);
    } catch (error) {
      // Log error but don't fail registration
      console.error('Failed to send verification email:', error);
    }

    // No session is issued here. Verification is enforced at login, so handing
    // out tokens now would let an unverified address straight into the app.
    return {
      message:
        'Registration successful. Check your email to verify your address.',
    };
  }

  // ── Validate (used by LocalStrategy) ──────────────────
  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    if (!user.emailVerified) {
      throw new ForbiddenException(
        'Please verify your email address before signing in.',
      );
    }

    return user;
  }

  // ── Resend verification ───────────────────────────────
  /**
   * Without this, an expired token is a dead end: the account cannot log in
   * and cannot obtain a fresh link.
   */
  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    const generic = {
      message: 'If the account exists and is unverified, a link has been sent',
    };

    if (!user || user.emailVerified) return generic;

    const verificationToken = randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: new Date(
          Date.now() + VERIFICATION_TOKEN_TTL_MS,
        ),
      },
    });

    try {
      await this.emailService.sendVerificationEmail(email, verificationToken);
    } catch (error) {
      console.error('Failed to resend verification email:', error);
    }

    return generic;
  }

  // ── Login ──────────────────────────────────────────────
  async login(userId: string, email: string) {
    const tokens = this.generateTokens(userId, email);

    const hashed = await bcrypt.hash(tokens.refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashed },
    });

    return tokens;
  }

  // ── Refresh ────────────────────────────────────────────
  async refresh(userId: string, email: string, rawRefreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.refreshToken) throw new UnauthorizedException();

    const match = await bcrypt.compare(rawRefreshToken, user.refreshToken);
    if (!match) throw new UnauthorizedException('Refresh token invalid');

    const tokens = this.generateTokens(userId, email);
    const hashed = await bcrypt.hash(tokens.refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashed },
    });

    return tokens;
  }

  // ── Logout ─────────────────────────────────────────────
  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: 'Logged out successfully' };
  }

  // ── Helpers ────────────────────────────────────────────
  private generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: ACCESS_TOKEN_TTL,
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: REFRESH_TOKEN_TTL,
    });

    return { accessToken, refreshToken };
  }

  async googleLogin(googleId: string, email: string, name: string) {
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          googleId,
          password: '',
          emailVerified: true, // Google accounts are pre-verified
        },
      });
    } else if (!user.googleId || !user.emailVerified) {
      // Completing Google's flow proves control of the address, so linking it
      // to an account that signed up by password also verifies it. Without
      // this, that account would keep failing password login with a 403.
      user = await this.prisma.user.update({
        where: { email },
        data: {
          googleId,
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
        },
      });
    }

    const tokens = this.generateTokens(user.id, user.email);
    const hashed = await bcrypt.hash(tokens.refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashed },
    });

    return tokens;
  }

  // ── Email Verification ────────────────────────────────
  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: { gte: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  // ── Password Reset ────────────────────────────────────
  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: expiresAt,
      },
    });

    try {
      await this.emailService.sendPasswordResetEmail(email, resetToken);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
    }

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gte: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        passwordResetToken: null,
        passwordResetExpires: null,
        // Receiving the reset link proves control of the address. Leaving this
        // false would strand an unverified account: it could reset its
        // password and still be refused at login.
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    return { message: 'Password reset successfully' };
  }
}
