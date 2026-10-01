import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { DomainError } from '../errors/domain-errors';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof DomainError) {
    res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
      code: err.code,
    });
    return;
  }

  if (err instanceof ZodError) {
    const formattedMessage = err.errors
      .map((e) => `${e.path.join('.') || 'payload'}: ${e.message}`)
      .join('; ');

    res.status(400).json({
      error: 'ValidationError',
      message: formattedMessage,
      code: 'INVALID_REQUEST_PAYLOAD',
    });
    return;
  }

  const message = err instanceof Error ? err.message : 'An unexpected internal error occurred.';
  console.error('[Unhandled Error]', err);

  res.status(500).json({
    error: 'InternalServerError',
    message,
    code: 'INTERNAL_SERVER_ERROR',
  });
}
