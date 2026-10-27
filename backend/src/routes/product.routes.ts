import { Router } from 'express';
import type { ProductController } from '../controller/product.controller';

export function createProductRouter(controller: ProductController): Router {
  const router = Router();

  router.get('/', controller.getAll);
  router.get('/:id', controller.getById);

  // ⚠️ TODO (cuando esté el módulo auth): estas tres rutas son SOLO PARA ADMIN.
  // Hoy están abiertas porque authenticate/requireAdmin todavía no están implementados.
  // Cuando lo estén: router.post('/', authenticate, requireAdmin, controller.create) (idem PATCH y DELETE).
  router.post('/', controller.create);
  router.patch('/:id/stock', controller.updateStock);
  router.delete('/:id', controller.remove);

  return router;
}
