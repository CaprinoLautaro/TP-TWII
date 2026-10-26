import type { Product } from '../../generated/prisma/client';
import { AppError } from '../utils/app-error';
import type { ProductRepository } from '../repository/product.repository';
import type { ProductFilters } from '../types/product.types';

/** SERVICIO: reglas de negocio y validaciones. No sabe nada de Express ni de Prisma. */
export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  getAll(filters: ProductFilters): Promise<Product[]> {
    return this.repository.findAll(filters);
  }

  async getById(id: number): Promise<Product> {
    const product = await this.repository.findById(id);
    if (!product) throw AppError.notFound('El producto no existe.');
    return product;
  }

  // TODO (opcional, admin): create(...) validando campos y nombre repetido (409), updateStock(...)
}
