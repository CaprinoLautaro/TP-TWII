import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import type { AuthController } from '../controller/auth.controller';

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();

  router.post('/signup', controller.signup);
  router.post('/signin', controller.signin);
  router.get('/me', authenticate, controller.me);
  router.put('/me', authenticate, controller.updateMe);

  return router;
}
