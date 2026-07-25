import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { REFRESH_COOKIE, cookieExtractor } from '../cookies';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    super({
      jwtFromRequest: cookieExtractor(REFRESH_COOKIE),
      secretOrKey: process.env.JWT_REFRESH_SECRET!,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: { sub: string; email: string }) {
    // AuthService compares this against the bcrypt hash stored on the user.
    const refreshToken = cookieExtractor(REFRESH_COOKIE)(req);
    return { ...payload, refreshToken };
  }
}
