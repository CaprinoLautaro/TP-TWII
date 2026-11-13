import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { AppError } from '../utils/app-error';

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; rol?: string };
    }
  }
}

interface JwtPayload {
  sub?: string;
  userId?: number;
  rol?: string;
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw AppError.unauthorized('Token no proporcionado.');
  }

  if (!config.jwtSecret) {
    throw new Error('Falta JWT_SECRET en la configuración del backend.');
  }

  try {
    const payload = jwt.verify(authHeader.slice(7), config.jwtSecret) as JwtPayload;
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

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.rol !== 'ADMIN') {
    throw AppError.forbidden('Acceso denegado: se requiere rol ADMIN.');
  }
  next();
}