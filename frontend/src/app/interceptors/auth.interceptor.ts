import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { STORAGE_KEYS } from '../config/storage-keys';

/**
 * Agrega el header `Authorization: Bearer <token>` a cada request.
 * Si el backend devuelve 401 en una ruta que no es /auth/, limpia la sesión y redirige al login
 * (en /auth/ el 401 significa "credenciales incorrectas", no "sesión expirada").
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem(STORAGE_KEYS.token);

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('/auth/')) {
        localStorage.removeItem(STORAGE_KEYS.token);
        localStorage.removeItem(STORAGE_KEYS.sesion);
        router.navigate(['/signin']);
      }
      return throwError(() => err);
    }),
  );
};