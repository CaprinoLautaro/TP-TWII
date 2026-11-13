import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/authService/auth-service';

/** Requiere haber iniciado sesión. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.estaLogueado() ? true : router.createUrlTree(['/signin']);
};

/** Requiere ser admin. Si no está logueado → /signin. Si está logueado pero no es admin → /. */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.estaLogueado()) return router.createUrlTree(['/signin']);
  return auth.esAdmin() ? true : router.createUrlTree(['/']);
};
