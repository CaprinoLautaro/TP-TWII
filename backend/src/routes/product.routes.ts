import { Router } from 'express';
import type { ProductController } from '../controller/product.controller';

export function createProductRouter(controller: ProductController): Router {
  const router = Router();

  router.get('/', controller.getAll);
  router.get('/:id', controller.getById);

  // TODO (opcional, admin): router.post('/', authenticate, requireAdmin, controller.create);

  return router;
}
