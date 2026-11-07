import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

const TOKEN_KEY = 'patitas_token';
const SESION_KEY = 'patitas_sesion';

/**
 * Agrega el header `Authorization: Bearer <token>` a cada request.
 * Si el backend devuelve 401 (token ausente, inválido o expirado),
 * limpia la sesión y redirige al login.
 *
 * Excepción: no redirige en requests a /auth/ (login/signup), porque ahí
 * el 401 significa "credenciales incorrectas", no "sesión expirada".
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem(TOKEN_KEY);

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('/auth/')) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(SESION_KEY);
        router.navigate(['/signin']);
      }
      return throwError(() => err);
    }),
  );
};