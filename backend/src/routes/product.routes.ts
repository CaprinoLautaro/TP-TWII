import { Router } from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import type { ProductController } from '../controller/product.controller';

export function createProductRouter(controller: ProductController): Router {
  const router = Router();

  // Catálogo público: cualquiera puede ver los productos sin login.
  router.get('/', controller.getAll);
  router.get('/:id', controller.getById);

  // Escritura: solo admin autenticado.
  router.post('/', authenticate, requireAdmin, controller.create);
  router.patch('/:id/stock', authenticate, requireAdmin, controller.updateStock);
  router.delete('/:id', authenticate, requireAdmin, controller.remove);

  return router;
}
