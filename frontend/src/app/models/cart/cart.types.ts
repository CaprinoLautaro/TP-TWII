/** Item local del frontend (solo id y cantidad; el producto sale de ProductService). */
export interface CartItem {
  productId: number;
  cantidad: number;
}

/** Item que devuelve el backend (coincide con CartItemWithProduct del backend). */
export interface CartItemResponse {
  id: number;
  userId: number;
  productId: number;
  cantidad: number;
  product: {
    id: number;
    nombre: string;
    precio: number;
    stock: number;
    imagen: string;
    clasificacion: string;
    descripcion: string;
  };
}

/** Respuesta del backend en cada operación (coincide con CartResponseDto del backend). */
export interface CartResponse {
  items: CartItemResponse[];
  total: number;
  cantidadTotal: number;
}