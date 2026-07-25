import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ACCESS_COOKIE, cookieExtractor } from '../cookies';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      // Cookie only. The bearer header is deliberately not accepted: tokens
      // readable by JavaScript are what this migration exists to remove.
      jwtFromRequest: cookieExtractor(ACCESS_COOKIE),
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: { sub: string; email: string }) {
    return { id: payload.sub, email: payload.email };
  }
}
