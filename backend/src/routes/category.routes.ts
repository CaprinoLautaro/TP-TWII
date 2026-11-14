import { Router } from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import type { CategoryController } from '../controller/category.controller';

export function createCategoryRouter(controller: CategoryController): Router {
  const router = Router();

  router.get('/', controller.getAll); // público: el catálogo y el formulario las necesitan
  router.post('/', authenticate, requireAdmin, controller.create); // solo admin

  return router;
}
