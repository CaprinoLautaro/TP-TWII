import type { CartItem, PrismaClient, Product } from '../../generated/prisma/client';

export type CartItemWithProduct = CartItem & { product: Product };

export class CartRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByUser(userId: number): Promise<CartItemWithProduct[]> {
    return this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { id: 'asc' },
    });
  }

  findItem(userId: number, productId: number): Promise<CartItem | null> {
    return this.prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });
  }

  /** Crea el item o le setea la cantidad exacta si ya existe. */
  saveItem(userId: number, productId: number, cantidad: number): Promise<CartItem> {
    return this.prisma.cartItem.upsert({
      where: { userId_productId: { userId, productId } },
      update: { cantidad },
      create: { userId, productId, cantidad },
    });
  }

  removeItem(userId: number, productId: number): Promise<CartItem> {
    return this.prisma.cartItem.delete({
      where: { userId_productId: { userId, productId } },
    });
  }

  clear(userId: number) {
    return this.prisma.cartItem.deleteMany({ where: { userId } });
  }
}
