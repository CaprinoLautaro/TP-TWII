import { AppError } from '../utils/app-error';
import type { ProductService } from './product.service';
import type { CartRepository } from '../repository/cart.repository';
import type { AddItemDto, CartResponseDto, UpdateItemDto } from '../types/cart.types';

export class CartService {
  constructor(
    private readonly repository: CartRepository,
    private readonly productService: ProductService,
  ) {}

  /** Carrito completo del usuario: items con producto, total en pesos y cantidad total. */
  async getCart(userId: number): Promise<CartResponseDto> {
    const items = await this.repository.findByUser(userId);
    return {
      items,
      total: this.calcularTotal(items),
      cantidadTotal: this.contarUnidades(items),
    };
  }

  /** Agrega o incrementa. Valida stock antes de persistir. */
  async addItem(userId: number, dto: AddItemDto): Promise<CartResponseDto> {
    const cantidad = this.parseCantidad(dto.cantidad);
    if (cantidad < 1) {
      throw AppError.badRequest('La cantidad debe ser al menos 1.');
    }

    const producto = await this.validarProductoYStock(dto.productId, cantidad);

    const itemExistente = await this.repository.findItem(userId, dto.productId);
    const cantidadActual = itemExistente?.cantidad ?? 0;
    const nuevaCantidad = cantidadActual + cantidad;

    if (nuevaCantidad > producto.stock) {
      throw AppError.badRequest(
        `Stock insuficiente de "${producto.nombre}": quedan ${producto.stock}.`,
      );
    }

    await this.repository.upsertItem(userId, dto.productId, nuevaCantidad);
    return this.getCart(userId);
  }

  /** Setea la cantidad exacta. Si es 0 o menos, elimina el item. */
  async updateItem(
    userId: number,
    productId: number,
    dto: UpdateItemDto,
  ): Promise<CartResponseDto> {
    const cantidad = this.parseCantidad(dto.cantidad);

    if (cantidad <= 0) {
      return this.removeItem(userId, productId);
    }

    await this.validarProductoYStock(productId, cantidad);

    const item = await this.repository.findItem(userId, productId);
    if (!item) {
      throw AppError.notFound('El producto no está en el carrito.');
    }

    await this.repository.upsertItem(userId, productId, cantidad);
    return this.getCart(userId);
  }

  /** Quita el item. 404 si no estaba en el carrito. */
  async removeItem(userId: number, productId: number): Promise<CartResponseDto> {
    const item = await this.repository.findItem(userId, productId);
    if (!item) {
      throw AppError.notFound('El producto no está en el carrito.');
    }
    await this.repository.removeItem(userId, productId);
    return this.getCart(userId);
  }

  // ─── helpers privados ───────────────────────────────────────

  /** Acepta number o string (viene de req.body), pero solo entero. */
  private parseCantidad(value: unknown): number {
    const n = Number(value);
    if (!Number.isInteger(n)) {
      throw AppError.badRequest('La cantidad debe ser un número entero.');
    }
    return n;
  }

  private async validarProductoYStock(productId: number, cantidad: number) {
    const producto = await this.productService.getById(productId);
    if (!producto) {
      throw AppError.notFound('El producto no existe.');
    }
    if (cantidad > producto.stock) {
      throw AppError.badRequest(
        `Stock insuficiente de "${producto.nombre}": quedan ${producto.stock}.`,
      );
    }
    return producto;
  }

  private calcularTotal(items: { product: { precio: number }; cantidad: number }[]) {
    return items.reduce((acc, { product, cantidad }) => acc + product.precio * cantidad, 0);
  }

  private contarUnidades(items: { cantidad: number }[]) {
    return items.reduce((acc, { cantidad }) => acc + cantidad, 0);
  }
}