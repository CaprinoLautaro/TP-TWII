import { AppError } from '../utils/app-error';
import type { ProductService } from './product.service';
import type { CartRepository } from '../repository/cart.repository';
import type { AddItemDto, UpdateItemDto } from '../types/cart.types';

export class CartService {
  constructor(
    private readonly repository: CartRepository,
    private readonly productService: ProductService,
  ) {}

  async getCart(_userId: number) {
    // TODO: devolver los items con su producto y el total (precio * cantidad).
    throw AppError.notImplemented('getCart');
  }

  async addItem(_userId: number, _dto: AddItemDto) {
    // TODO: validar cantidad >= 1, que el producto exista (productService.getById)
    //       y que (lo que ya hay en el carrito + cantidad) no supere el stock. Si ya existe, suma.
    throw AppError.notImplemented('addItem');
  }

  async updateItem(_userId: number, _productId: number, _dto: UpdateItemDto) {
    // TODO: setear la cantidad exacta (validando stock). Si es 0 o menos, quitar el item.
    throw AppError.notImplemented('updateItem');
  }

  async removeItem(_userId: number, _productId: number) {
    // TODO: quitar el producto del carrito (404 si no estaba).
    throw AppError.notImplemented('removeItem');
  }
}
