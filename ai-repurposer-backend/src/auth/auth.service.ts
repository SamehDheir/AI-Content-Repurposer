import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // ── Register ──────────────────────────────────────────
  async register(email: string, password: string, name?: string) {
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(password, 12);
    const user = await this.prisma.user.create({
      data: { email, password: hashed, name },
    });

    return this.generateTokens(user.id, user.email);
  }

  // ── Validate (used by LocalStrategy) ──────────────────
  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    return user;
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
      expiresIn: '7d',
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
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
        },
      });
    } else if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { email },
        data: { googleId },
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
}
