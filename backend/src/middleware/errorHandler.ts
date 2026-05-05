import { Request, Response, NextFunction } from 'express';

export interface ErrorResponse {
  error: {
    message: string;
    code?: string;
  };
}

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err);

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    res.status(409).json({
      error: {
        message: `${field} already exists`,
        code: 'DUPLICATE_FIELD',
      },
    });
    return;
  }

  // Default error
  res.status(err.status || 500).json({
    error: {
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      code: err.code || 'INTERNAL_ERROR',
    },
  });
};
