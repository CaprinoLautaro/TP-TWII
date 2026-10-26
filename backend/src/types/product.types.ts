export interface ProductFilters {
  clasificacion?: string;
}

/** Clasificaciones válidas. Tiene que coincidir con CATEGORIAS del frontend. */
export const CATEGORIAS = ['Alimento', 'Juguetes', 'Accesorios', 'Higiene', 'Camas'];

export interface CreateProductDto {
  nombre: string;
  descripcion: string;
  clasificacion: string;
  precio: number;
  stock: number;
  imagen: string;
}
