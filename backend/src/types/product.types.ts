export interface ProductFilters {
  clasificacion?: string;
}

export const MASCOTAS = ['PERRO', 'GATO', 'AMBOS'] as const;
export type Mascota = (typeof MASCOTAS)[number];

export interface CreateProductDto {
  nombre: string;
  descripcion: string;
  clasificacion: string;
  mascota: Mascota;
  precio: number;
  stock: number;
  imagen: string;
}
