import type { Categoria } from '../../generated/prisma/client';
import { AppError } from '../utils/app-error';
import type { CategoryRepository } from '../repository/category.repository';

/** SERVICIO de categorías: validaciones y reglas. */
export class CategoryService {
  constructor(private readonly repository: CategoryRepository) {}

  getAll(): Promise<Categoria[]> {
    return this.repository.findAll();
  }

  /** `body` viene de HTTP sin tipar. Devuelve la categoría creada o lanza 400 / 409. */
  async create(body: unknown): Promise<Categoria> {
    const crudo = typeof body === 'object' && body !== null ? (body as Record<string, unknown>)['nombre'] : undefined;
    const nombre = typeof crudo === 'string' ? crudo.trim().replace(/\s+/g, ' ') : '';

    if (nombre.length < 3 || nombre.length > 30) {
      throw AppError.badRequest('El nombre de la categoría debe tener entre 3 y 30 caracteres.');
    }
    if (await this.repository.findByNombre(nombre)) {
      throw AppError.conflict('Ya existe una categoría con ese nombre.');
    }
    return this.repository.create(nombre);
  }

  /** Para que ProductService compruebe que la clasificación elegida existe (devuelve null si no). */
  buscarPorNombre(nombre: string): Promise<Categoria | null> {
    return this.repository.findByNombre(nombre);
  }
}
