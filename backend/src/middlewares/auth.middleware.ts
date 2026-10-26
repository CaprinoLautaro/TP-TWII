import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/app-error';

// TODO (módulo auth): verificar el token JWT del header "Authorization: Bearer <token>",
// cargar el usuario en la request (hay que extender el tipo Request) y llamar a next().
export function authenticate(_req: Request, _res: Response, _next: NextFunction) {
  throw AppError.notImplemented('authenticate');
}

// TODO: dejar pasar solo si el usuario autenticado tiene rol ADMIN (si no, AppError.forbidden()).
export function requireAdmin(_req: Request, _res: Response, _next: NextFunction) {
  throw AppError.notImplemented('requireAdmin');
}
