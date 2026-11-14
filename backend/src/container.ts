import { prisma } from './config/prisma';

import { AuthController } from './controller/auth.controller';
import { CartController } from './controller/cart.controller';
import { CategoryController } from './controller/category.controller';
import { OrderController } from './controller/order.controller';
import { ProductController } from './controller/product.controller';

import { AuthRepository } from './repository/auth.repository';
import { CartRepository } from './repository/cart.repository';
import { CategoryRepository } from './repository/category.repository';
import { OrderRepository } from './repository/order.repository';
import { ProductRepository } from './repository/product.repository';

import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';
import { CategoryService } from './services/category.service';
import { OrderService } from './services/order.service';
import { ProductService } from './services/product.service';

/**
 * Acá se crean las piezas y se conectan entre sí (repositorio -> servicio -> controlador).
 * Si un servicio necesita a otro (el carrito usa productos), se lo pasa por el constructor.
 * Cuando agregues una clase nueva, se instancia acá.
 */

// Repositorios (hablan con la base de datos)
const authRepository = new AuthRepository(prisma);
const productRepository = new ProductRepository(prisma);
const cartRepository = new CartRepository(prisma);
const orderRepository = new OrderRepository(prisma);
const categoryRepository = new CategoryRepository(prisma);

// Servicios (reglas de negocio)
const authService = new AuthService(authRepository);
const categoryService = new CategoryService(categoryRepository);
const productService = new ProductService(productRepository, categoryService);
const cartService = new CartService(cartRepository, productService);
const orderService = new OrderService(orderRepository, cartService, productService);

// Controladores (reciben las requests HTTP)
export const authController = new AuthController(authService);
export const productController = new ProductController(productService);
export const cartController = new CartController(cartService);
export const orderController = new OrderController(orderService);
export const categoryController = new CategoryController(categoryService);
