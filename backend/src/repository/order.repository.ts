import type { Order, OrderItem, PrismaClient } from '../../generated/prisma/client';

export type OrderWithItems = Order & { items: OrderItem[] };

export class OrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByUser(userId: number): Promise<OrderWithItems[]> {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { id: 'desc' },
    });
  }

  findById(id: number): Promise<OrderWithItems | null> {
    return this.prisma.order.findUnique({ where: { id }, include: { items: true } });
  }

  // TODO: create(...) -> crear Order + OrderItems, descontar stock y vaciar el carrito
  //       todo junto en UNA transacción (this.prisma.$transaction) para que no quede a medias.
}
