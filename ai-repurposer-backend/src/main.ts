import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

const DEFAULT_ORIGIN = 'http://localhost:3000';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Also removes `x-powered-by: Express`, which was advertising the stack.
  app.use(
    helmet({
      // The API returns JSON, never HTML, and the frontend is a separate
      // origin. `same-origin` (the default) would refuse cross-origin
      // subresource loads of anything served from here.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // The throttler keys on client IP. Behind a proxy every request arrives from
  // the proxy's address, so one bucket would cover all users — but trusting
  // `X-Forwarded-For` when there is NO proxy in front is worse: anyone can set
  // the header and get a fresh bucket per request. So this is opt-in, and must
  // only be set when something really does terminate in front of the app.
  if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
  }

  // Auth tokens travel as HttpOnly cookies, so the strategies need them parsed.
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Credentialed CORS cannot use a wildcard origin — every allowed origin has
  // to be listed explicitly, so this is driven by env rather than hardcoded.
  const origins = (process.env.CORS_ORIGINS ?? DEFAULT_ORIGIN)
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept',
  });

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
