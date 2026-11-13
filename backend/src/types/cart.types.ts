import type { CartItem, Product } from '../../generated/prisma/client';

/** Un item del carrito con su producto ya cargado (lo que devuelve el repository). */
export type CartItemWithProduct = CartItem & { product: Product };

/** POST /api/cart/items */
export interface AddItemDto {
  productId: number;
  cantidad: number;
}

/** PATCH /api/cart/items/:productId */
export interface UpdateItemDto {
  cantidad: number;
}

/** Lo que devuelve el backend en cada operación del carrito. */
export interface CartResponseDto {
  items: CartItemWithProduct[];
  total: number;
  cantidadTotal: number;
}