import type { PrismaClient, Product } from '../../generated/prisma/client';
import type { CreateProductDto, ProductFilters } from '../types/product.types';

/** REPOSITORIO: único lugar que habla con la base de datos. No tiene reglas de negocio. */
export class ProductRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findAll(filters: ProductFilters): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: filters.clasificacion ? { clasificacion: filters.clasificacion } : undefined,
      orderBy: { id: 'asc' },
    });
  }

  findById(id: number): Promise<Product | null> {
    return this.prisma.product.findUnique({ where: { id } });
  }

  /** Busca por nombre sin distinguir mayúsculas ("Collar" y "collar" son el mismo producto). */
  findByNombre(nombre: string): Promise<Product | null> {
    return this.prisma.product.findFirst({
      where: { nombre: { equals: nombre, mode: 'insensitive' } },
    });
  }

  create(data: CreateProductDto): Promise<Product> {
    return this.prisma.product.create({ data });
  }

  updateStock(id: number, stock: number): Promise<Product> {
    return this.prisma.product.update({ where: { id }, data: { stock } });
  }

  /** Cantidad de renglones de pedidos que incluyen este producto. */
  countInOrders(id: number): Promise<number> {
    return this.prisma.orderItem.count({ where: { productId: id } });
  }

  /** Borra el producto. Los items de carrito que lo tenían se borran solos (onDelete: Cascade). */
  delete(id: number): Promise<Product> {
    return this.prisma.product.delete({ where: { id } });
  }
}
