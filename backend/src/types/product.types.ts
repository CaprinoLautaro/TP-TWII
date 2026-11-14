export interface ProductFilters {
  clasificacion?: string;
}

export interface CreateProductDto {
  nombre: string;
  descripcion: string;
  clasificacion: string;
  precio: number;
  stock: number;
  imagen: string;
}
