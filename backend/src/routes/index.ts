import { Router } from 'express';
import {
  authController,
  cartController,
  categoryController,
  orderController,
  productController,
} from '../container';
import { createAuthRouter } from './auth.routes';
import { createCartRouter } from './cart.routes';
import { createCategoryRouter } from './category.routes';
import { createOrderRouter } from './order.routes';
import { createProductRouter } from './product.routes';

/** Acá se registra cada grupo de rutas bajo su prefijo: /api/products, /api/auth, etc. */
export const apiRouter = Router();

apiRouter.use('/products', createProductRouter(productController));
apiRouter.use('/auth', createAuthRouter(authController));
apiRouter.use('/cart', createCartRouter(cartController));
apiRouter.use('/orders', createOrderRouter(orderController));
apiRouter.use('/categories', createCategoryRouter(categoryController));
