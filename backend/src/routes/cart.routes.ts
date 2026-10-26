import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import type { CartController } from '../controller/cart.controller';

export function createCartRouter(controller: CartController): Router {
  const router = Router();

  router.use(authenticate); // todo el carrito requiere sesión iniciada

  router.get('/', controller.getCart);
  router.post('/items', controller.addItem);
  router.patch('/items/:productId', controller.updateItem);
  router.delete('/items/:productId', controller.removeItem);

  return router;
}
