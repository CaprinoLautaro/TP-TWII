import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import type { OrderController } from '../controller/order.controller';

export function createOrderRouter(controller: OrderController): Router {
  const router = Router();

  router.use(authenticate);

  router.post('/', controller.confirm);
  router.get('/', controller.list);
  router.get('/:id', controller.getById);

  return router;
}
