import type { Categoria, PrismaClient } from '../../generated/prisma/client';

/** REPOSITORIO de categorías: solo habla con la base de datos. */
export class CategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findAll(): Promise<Categoria[]> {
    return this.prisma.categoria.findMany({ orderBy: { id: 'asc' } });
  }

  /** Busca por nombre sin distinguir mayúsculas ("camas" y "Camas" son la misma categoría). */
  findByNombre(nombre: string): Promise<Categoria | null> {
    return this.prisma.categoria.findFirst({
      where: { nombre: { equals: nombre, mode: 'insensitive' } },
    });
  }

  create(nombre: string): Promise<Categoria> {
    return this.prisma.categoria.create({ data: { nombre } });
  }
}
