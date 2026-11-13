import type { PrismaClient } from '../../generated/prisma/client';
import { AppError } from '../utils/app-error';


export interface GuardarOrdenDto {
  userId: number;
  total: number;
  metodoPago: string;
  ultimosDigitosTarjeta?: string;
  items: Array<{ productId: number; cantidad: number; precioUnitario: number }>;
}


export class OrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Devolveria todos los pedidos del usuario
  findByUser(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } } },
      orderBy: { id: 'desc' },
    });
  }

  // Busca pedido por ID y usuario, para que un usuario no pueda ver pedidos de otro
  findById(userId: number, orderId: number) {
    return this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: { include: { product: true } } },
    });
  }

  // Guarda la orden en una transaccion
  async crearOrden(data: GuardarOrdenDto) {
    return this.prisma.$transaction(async (tx) => {
      // Descontar stock solo si alcanza el stock
      for (const item of data.items) {
        const actualizado = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.cantidad },
          },
          data: {
            stock: { decrement: item.cantidad },
          },
        });

        if (actualizado.count === 0) {
          throw AppError.badRequest(
            `Stock insuficiente o producto no disponible (ID ${item.productId}).`
          );
        }
      }

      // Crea el registro de la orden y los items asociados en la misma transaccion
      const nuevaOrden = await tx.order.create({
        data: {
          userId: data.userId,
          total: data.total,
          metodoPago: data.metodoPago,
          ultimosDigitosTarjeta: data.ultimosDigitosTarjeta ?? null,
          items: {
            create: data.items.map((it) => ({
              productId: it.productId,
              cantidad: it.cantidad,
              precioUnitario: it.precioUnitario,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
          user: true,
        },
      });

      // Vacia el carrito
      await tx.cartItem.deleteMany({
        where: { userId: data.userId },
      });

      // Devuelve la orden recien creada 
      return nuevaOrden;
    });
  }
}