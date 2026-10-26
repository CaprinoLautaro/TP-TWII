import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/app-error';

export function notFoundMiddleware(_req: Request, res: Response) {
  res.status(404).json({ error: 'Ruta no encontrada' });
}

/** Express 5 manda acá los errores de los controladores async, no hace falta try/catch en cada uno. */
export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
}
