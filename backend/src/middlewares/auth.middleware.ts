import type { NextFunction, Request, Response } from 'express';
// import { AppError } from '../utils/app-error';  // ← descomentar cuando se implemente el auth real

// ─────────────────────────────────────────────────────────────
// VERSIÓN ORIGINAL (comentada) — para retomar cuando se defina el auth real
// ─────────────────────────────────────────────────────────────
//
// // TODO (módulo auth): verificar el token JWT del header "Authorization: Bearer <token>",
// // cargar el usuario en la request (hay que extender el tipo Request) y llamar a next().
// export function authenticate(_req: Request, _res: Response, _next: NextFunction) {
//   throw AppError.notImplemented('authenticate');
// }
//
// // TODO: dejar pasar solo si el usuario autenticado tiene rol ADMIN (si no, AppError.forbidden()).
// export function requireAdmin(_req: Request, _res: Response, _next: NextFunction) {
//   throw AppError.notImplemented('requireAdmin');
// }

// ─────────────────────────────────────────────────────────────
// MOCK TEMPORAL (activo) — inyecta un usuario fijo para probar el carrito
// ─────────────────────────────────────────────────────────────
//
// Mientras el equipo define el mecanismo de auth (JWT, sesiones, cookies, etc.),
// este bloque simula un usuario autenticado con id = 1 (cliente@test.com, del seed).
//
// CUANDO SE IMPLEMENTE EL AUTH REAL:
//   1. Descomentar el bloque "VERSIÓN ORIGINAL" de arriba.
//   2. Completar el cuerpo de `authenticate` con la verificación del JWT.
//   3. Completar `requireAdmin` con la validación del rol.
//   4. Borrar el bloque "MOCK TEMPORAL" (este).
//   5. Descomentar el import de `AppError`.
//
// El contrato (req.user.id) se mantiene: controladores, servicios y repositorios no cambian.

/**
 * MOCK TEMPORAL: inyecta un usuario fijo (id: 1) para poder probar el carrito
 * sin depender de la autenticación real.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  (req as any).user = { id: 1 };
  next();
}

/**
 * MOCK TEMPORAL: deja pasar siempre. NO valida el rol.
 * Mientras sea mock, cualquier ruta que use `requireAdmin` está desprotegida.
 */
export function requireAdmin(_req: Request, _res: Response, next: NextFunction) {
  next();
}