import { AppError } from '../utils/app-error';
import type { CartService } from './cart.service';
import type { ProductService } from './product.service';
import type { OrderRepository } from '../repository/order.repository';

export class OrderService {
  constructor(
    private readonly repository: OrderRepository,
    private readonly cartService: CartService,
    private readonly productService: ProductService,
  ) {}

  async confirm(_userId: number) {
    // TODO: leer el carrito, validar que no esté vacío y que alcance el stock de cada producto,
    //       crear el pedido guardando el precio de cada item, descontar stock y vaciar el carrito.
    throw AppError.notImplemented('confirm');
  }

  async list(_userId: number) {
    // TODO: pedidos del usuario autenticado.
    throw AppError.notImplemented('list');
  }

  async getById(_userId: number, _orderId: number) {
    // TODO: detalle de un pedido; 404 si no existe o si es de otro usuario.
    throw AppError.notImplemented('getById');
  }
}
