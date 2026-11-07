import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/app-error';

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; rol?: string };
    }
  }
}

/**
 * Verifica el JWT del header "Authorization: Bearer <token>".
 * Extrae el userId del payload y lo deja en req.user.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw AppError.unauthorized('Token no proporcionado.');
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      sub?: string;
      userId?: number;
      rol?: string;
    };

    const userId = payload.userId ?? Number(payload.sub);

    if (!userId || Number.isNaN(userId)) {
      throw AppError.unauthorized('Token inválido: falta userId.');
    }

    req.user = { id: userId, rol: payload.rol };
    next();
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw AppError.unauthorized('Token inválido o expirado.');
  }
}

/**
 * Deja pasar solo a usuarios con rol ADMIN. Requiere `authenticate` antes.
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.rol !== 'ADMIN') {
    throw AppError.forbidden('Acceso denegado: se requiere rol ADMIN.');
  }
  next();
}