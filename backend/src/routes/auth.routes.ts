import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import type { AuthController } from '../controller/auth.controller';
import { forgotPasswordLimiter } from '../middlewares/rate-limit.middleware';

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();

  router.post('/signup', controller.signup);
  router.post('/signin', controller.signin);
  router.get('/me', authenticate, controller.me);
  router.put('/me', authenticate, controller.updateMe);
  router.post(
    '/forgot-password',
    forgotPasswordLimiter,
    controller.requestPasswordReset
  );
  router.post('/reset-password', controller.resetPassword);

  return router;
}
