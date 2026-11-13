import { AppError } from '../utils/app-error';
import type { OrderRepository } from '../repository/order.repository';
import type { CartService } from './cart.service';
import type { ProductService } from './product.service';

export interface ItemPedidoDto {
  productId: number;
  cantidad: number;
}

// Estructura del pedido que recibe el servicio al confirmar la compra
export interface CrearPedidoDTO {
  items: ItemPedidoDto[];
  metodoPago: string;
  ultimosDigitosTarjeta?: string;
}

// Reglas de negocio, validaciones y armado de respuestas
export class OrderService {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly cartService: CartService,
    private readonly productService: ProductService, 
  ) {}

  // Valida el pedido, calcula el total y coordina el guardado de la orden
  async confirm(userId: number, dto: CrearPedidoDTO) {
    const { items, metodoPago, ultimosDigitosTarjeta } = dto;

    // Valida que el carrito y metodo de pago no esten vacios
    if (!items || items.length === 0) {
      throw AppError.badRequest('El carrito no contiene items.');
    }
    if (!metodoPago?.trim()) {
      throw AppError.badRequest('Debe especificar un método de pago.');
    }

    // Validacion de los ultimos 4 digitos de la tarjeta (si se envian)
    if (
      ultimosDigitosTarjeta !== undefined &&
      ultimosDigitosTarjeta !== null &&
      !/^\d{4}$/.test(ultimosDigitosTarjeta)
    ) {
      throw AppError.badRequest('Los últimos dígitos de la tarjeta deben ser exactamente 4 números.');
    }

    // Verifica la existencia y stock de cada producto y calcula el total en el proceso
    let totalCalculado = 0;
    const itemsProcesados: Array<{ productId: number; cantidad: number; precioUnitario: number }> = [];

    for (const item of items) {
      // Validar que no se pueda mandar 0, negativos o decimal como cantidad
      if (!Number.isInteger(item.cantidad) || item.cantidad < 1) {
        throw AppError.badRequest('La cantidad de cada producto debe ser un número entero mayor o igual a 1.');
      }
      const producto = await this.productService.getById(item.productId);
      if (!producto) {
        throw AppError.notFound(`El producto con ID ${item.productId} no existe.`);
      }
      if (producto.stock < item.cantidad) {
        throw AppError.badRequest(`Stock insuficiente de "${producto.nombre}". Disponibles: ${producto.stock}.`);
      }

      totalCalculado += producto.precio * item.cantidad;
      itemsProcesados.push({
        productId: item.productId,
        cantidad: item.cantidad,
        precioUnitario: producto.precio,
      });
    }

    // Redondea a 2 decimales 
    const totalFinal = Math.round(totalCalculado * 100) / 100;

    // Envia los datos validados al repo para guardar en la BD
    const nuevaOrden = await this.orderRepo.crearOrden({
      userId,
      total: totalFinal,
      metodoPago,
      ultimosDigitosTarjeta,
      items: itemsProcesados,
    });

    // Formatea el comprobante para el front sin expones los datos sensibles
    return {
      orderId: `PED-${nuevaOrden.id}`,
      fecha: nuevaOrden.createdAt,
      usuario: {
        nombre: nuevaOrden.user.nombre,
        apellido: nuevaOrden.user.apellido,
        email: nuevaOrden.user.email,
        direccion: nuevaOrden.user.direccion,
      },
      metodoPago: nuevaOrden.metodoPago,
      ultimosDigitosTarjeta: nuevaOrden.ultimosDigitosTarjeta,
      total: nuevaOrden.total,
      items: nuevaOrden.items,
    };
  }


  // Devuelve el historial completo de pedidos del usuario logeado
  async list(userId: number) {
    return this.orderRepo.findByUser(userId);
  }

  // Busca un pedido especifico por ID y usuario
  async getById(userId: number, orderId: number) {
    const orden = await this.orderRepo.findById(userId, orderId);
    if (!orden) throw AppError.notFound('Pedido no encontrado.');
    return orden;
  }
  
}