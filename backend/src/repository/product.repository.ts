import type { PrismaClient, Product } from '../../generated/prisma/client';
import type { ProductFilters } from '../types/product.types';

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

  // TODO (opcional, admin): create(data), updateStock(id, stock)
}
