import { AppError } from '../utils/app-error';
import type { ProductService } from './product.service';
import type { CartRepository } from '../repository/cart.repository';
import type { AddItemDto, UpdateItemDto } from '../types/cart.types';

export class CartService {
  constructor(
    private readonly repository: CartRepository,
    private readonly productService: ProductService,
  ) {}

  /** Devuelve el carrito completo: items con producto, total en pesos y cantidad total. */
  async getCart(userId: number) {
    const items = await this.repository.findByUser(userId);
    const total = items.reduce(
      (acc, item) => acc + item.product.precio * item.cantidad,
      0,
    );
    const cantidadTotal = items.reduce((acc, item) => acc + item.cantidad, 0);
    return { items, total, cantidadTotal };
  }

  /** POST /cart/items — agrega o incrementa. Valida stock antes de persistir. */
  async addItem(userId: number, dto: AddItemDto) {
    const cantidad = Number(dto.cantidad);
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      throw AppError.badRequest('La cantidad debe ser al menos 1.');
    }

    const producto = await this.productService.getById(dto.productId);
    if (!producto) {
      throw AppError.notFound('El producto no existe.');
    }

    const itemExistente = await this.repository.findItem(userId, dto.productId);
    const cantidadActual = itemExistente?.cantidad ?? 0;
    const nuevaCantidad = cantidadActual + cantidad;

    if (nuevaCantidad > producto.stock) {
      throw AppError.badRequest(
        `Stock insuficiente de "${producto.nombre}": quedan ${producto.stock}.`,
      );
    }

    await this.repository.saveItem(userId, dto.productId, nuevaCantidad);
    return this.getCart(userId);
  }

  /** PATCH /cart/items/:productId — setea cantidad exacta. Si es 0 o menos, elimina. */
  async updateItem(userId: number, productId: number, dto: UpdateItemDto) {
    const cantidad = Number(dto.cantidad);
    if (!Number.isInteger(cantidad)) {
      throw AppError.badRequest('La cantidad debe ser un número entero.');
    }

    if (cantidad <= 0) {
      return this.removeItem(userId, productId);
    }

    const producto = await this.productService.getById(productId);
    if (!producto) {
      throw AppError.notFound('El producto no existe.');
    }

    if (cantidad > producto.stock) {
      throw AppError.badRequest(
        `Stock insuficiente de "${producto.nombre}": quedan ${producto.stock}.`,
      );
    }

    const item = await this.repository.findItem(userId, productId);
    if (!item) {
      throw AppError.notFound('El producto no está en el carrito.');
    }

    await this.repository.saveItem(userId, productId, cantidad);
    return this.getCart(userId);
  }

  /** DELETE /cart/items/:productId — 404 si no estaba en el carrito. */
  async removeItem(userId: number, productId: number) {
    const item = await this.repository.findItem(userId, productId);
    if (!item) {
      throw AppError.notFound('El producto no está en el carrito.');
    }
    await this.repository.removeItem(userId, productId);
    return this.getCart(userId);
  }
}