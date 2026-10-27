import type { Product } from '../../generated/prisma/client';
import { AppError } from '../utils/app-error';
import { parseCreateProduct, parseStock } from '../utils/product-rules';
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

  /** `body` es lo que llegó por HTTP, sin tipar: se valida acá. */
  async create(body: unknown): Promise<Product> {
    const datos = parseCreateProduct(body);

    const repetido = await this.repository.findByNombre(datos.nombre);
    if (repetido) throw AppError.conflict('Ya existe un producto con ese nombre.');

    return this.repository.create(datos);
  }

  async updateStock(id: number, body: unknown): Promise<Product> {
    const stock = parseStock(body);
    await this.getById(id); // 404 si no existe
    return this.repository.updateStock(id, stock);
  }

  /**
   * Un producto que ya se vendió no se puede borrar: los pedidos viejos lo necesitan
   * para mostrar qué se compró. En ese caso conviene dejarlo sin stock.
   */
  async delete(id: number): Promise<void> {
    await this.getById(id); // 404 si no existe
    if ((await this.repository.countInOrders(id)) > 0) {
      throw AppError.conflict(
        'No se puede eliminar: este producto figura en pedidos ya realizados. Podés dejarlo sin stock.',
      );
    }
    await this.repository.delete(id);
  }
}
