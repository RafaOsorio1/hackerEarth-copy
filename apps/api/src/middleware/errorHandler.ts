import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
      code: err.code,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'ValidationError',
      message: err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      code: 'INVALID_REQUEST_PAYLOAD',
    });
    return;
  }

  const message = err instanceof Error ? err.message : 'Internal Server Error';
  res.status(500).json({
    error: 'InternalServerError',
    message,
    code: 'INTERNAL_SERVER_ERROR',
  });
}
