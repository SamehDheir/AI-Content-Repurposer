import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

/**
 * The last stop before Nest's default handler.
 *
 * Anything that was not an `HttpException` used to fall through to that
 * handler, which answers a bare `500 Internal server error`. A Prisma
 * `P2025` (record not found) and a `fetch` failure to OpenRouter looked
 * identical from the client, and the actual cause only existed in the process
 * log.
 *
 * Planned in ROADMAP phase 4 and never written, because that phase was
 * deliberately behaviour-preserving.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message } = this.describe(exception);

    // Full detail to the log, never to the client: Prisma errors carry the
    // connection string and driver errors can carry credentials.
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private describe(exception: unknown): { status: number; message: unknown } {
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      return {
        status: exception.getStatus(),
        // Nest wraps validation errors in an object; pass it through so the
        // per-field messages from class-validator survive.
        message:
          typeof body === 'object' && body !== null && 'message' in body
            ? (body as { message: unknown }).message
            : body,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2025':
          return { status: HttpStatus.NOT_FOUND, message: 'Not found' };
        case 'P2002':
          return {
            status: HttpStatus.CONFLICT,
            message: 'That value is already taken',
          };
        case 'P2003':
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'Referenced record does not exist',
          };
      }
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return { status: HttpStatus.BAD_REQUEST, message: 'Invalid request' };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }
}
