import { prisma } from '../config/prisma';
import { OrderRepository } from '../repository/order.repository';
import { CartService } from './cart.service';
import { ProductService } from './product.service';
import { AppError } from '../utils/app-error';

export interface ItemPayload {
  productId: number;
  cantidad: number;
}

export interface CrearPedidoDTO {
  usuario?: {
    nombre: string;
    apellido: string;
    email: string;
    direccion: string;
  };
  items: Array<{ productId: number; cantidad: number }>;
  metodoPago: string;
  /** Solo los últimos 4 dígitos; el frontend nunca envía el número completo. */
  ultimosDigitosTarjeta?: string;
}

export class OrderService {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly cartService: CartService,
    private readonly productService: ProductService
  ) {}

async confirm(userId: number, dto: CrearPedidoDTO) {
  const { items } = dto;

  if (!items || items.length === 0) {
    throw new Error('El carrito no contiene items.');
  }

  const metodoPago = (dto.metodoPago ?? '').trim();
  if (!metodoPago) {
    throw AppError.badRequest('Seleccioná un medio de pago.');
  }

  const ultimosDigitosTarjeta = dto.ultimosDigitosTarjeta?.trim() || null;
  if (ultimosDigitosTarjeta && !/^\d{4}$/.test(ultimosDigitosTarjeta)) {
    throw AppError.badRequest('Los últimos dígitos de la tarjeta son inválidos.');
  }

  return await prisma.$transaction(async (tx) => {
    let totalCalculado = 0;
    const itemsParaGuardar: Array<{ productId: number; cantidad: number; precioUnitario: number }> = [];

    for (const item of items) {
      const producto = await tx.product.findUnique({
        where: { id: item.productId }
      });

      if (!producto) {
        throw new Error(`El producto con ID ${item.productId} no existe.`);
      }

      if (producto.stock < item.cantidad) {
        throw new Error(`Stock insuficiente para "${producto.nombre}". Disponibles: ${producto.stock}`);
      }

      totalCalculado += producto.precio * item.cantidad;

      itemsParaGuardar.push({
        productId: item.productId,
        cantidad: item.cantidad,
        precioUnitario: producto.precio
      });

      await tx.product.update({
        where: { id: item.productId },
        data: { stock: producto.stock - item.cantidad }
      });
    }

    const nuevaOrden = await tx.order.create({
      data: {
        userId,
        total: Math.round(totalCalculado),
        metodoPago,
        ultimosDigitosTarjeta,
        items: {
          create: itemsParaGuardar.map(it => ({
            productId: it.productId,
            cantidad: it.cantidad,
            precioUnitario: it.precioUnitario
          }))
        }
      },
      include: {
        items: {
          include: { product: true }
        },
        user: true
      }
    });

    await tx.cartItem.deleteMany({
      where: { userId }
    });

    return {
      orderId: `PED-${nuevaOrden.id}`,
      fecha: nuevaOrden.createdAt,
      usuario: {
        nombre: nuevaOrden.user.nombre,
        apellido: nuevaOrden.user.apellido,
        email: nuevaOrden.user.email,
        direccion: nuevaOrden.user.direccion
      },
      metodoPago: nuevaOrden.metodoPago,
      ultimosDigitosTarjeta: nuevaOrden.ultimosDigitosTarjeta,
      total: nuevaOrden.total,
      items: nuevaOrden.items
    };
  });
}

async list(userId: number) {
  return await prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: { product: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

async getById(userId: number, orderId: number) {
  return await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      items: {
        include: { product: true }
      }
    }
  });
}
}