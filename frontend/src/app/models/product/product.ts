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

export const CATEGORIAS = ['Alimento', 'Juguetes', 'Accesorios', 'Higiene', 'Camas'];

export const IMAGEN_POR_DEFECTO = 'https://loremflickr.com/400/300/pet?lock=99';
