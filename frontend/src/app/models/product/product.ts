export interface Product {
  id: number;
  nombre: string;
  descripcion: string;
  clasificacion: string;
  precio: number;
  stock: number;
  imagen: string;
}

// Lo que se envía al crear un producto (el id lo asigna el servicio / el backend).
export type NuevoProducto = Omit<Product, 'id'>;

/** Categoría de producto. La lista vive en la base de datos y el admin puede agregar nuevas. */
export interface Categoria {
  id: number;
  nombre: string;
}

export const IMAGEN_POR_DEFECTO = 'img/productos/default.png';
