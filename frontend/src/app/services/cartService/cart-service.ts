import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

/** Item local del frontend (solo id y cantidad; el producto sale de ProductService). */
export interface CartItem {
  productId: number;
  cantidad: number;
}

/** Item que devuelve el backend (incluye el producto completo). */
interface CartItemResponse {
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

/** Respuesta del backend en cada operación. */
export interface CartResponse {
  items: CartItemResponse[];
  total: number;
  cantidadTotal: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);

  private readonly items = signal<CartItem[]>([]);
  readonly carrito = this.items.asReadonly();
  readonly cantidadTotal = computed(() =>
    this.items().reduce((acc, i) => acc + i.cantidad, 0),
  );

  constructor() {
    // Carga el carrito al iniciar la app (por si el usuario recarga).
    this.cargar();
  }

  /** GET /api/cart */
  cargar(): void {
    this.http.get<CartResponse>('/api/cart').subscribe({
      next: (r) => this.items.set(this.mapItems(r)),
      error: () => this.items.set([]),
    });
  }

  /** POST /api/cart/items */
  agregar(productId: number, cantidad = 1): Observable<CartResponse> {
    return this.http
      .post<CartResponse>('/api/cart/items', { productId, cantidad })
      .pipe(tap((r) => this.items.set(this.mapItems(r))));
  }

  /** PATCH /api/cart/items/:productId */
  cambiarCantidad(productId: number, cantidad: number): Observable<CartResponse> {
    return this.http
      .patch<CartResponse>(`/api/cart/items/${productId}`, { cantidad })
      .pipe(tap((r) => this.items.set(this.mapItems(r))));
  }

  /** DELETE /api/cart/items/:productId */
  quitar(productId: number): Observable<CartResponse> {
    return this.http
      .delete<CartResponse>(`/api/cart/items/${productId}`)
      .pipe(tap((r) => this.items.set(this.mapItems(r))));
  }

  /** El backend devuelve items con producto; el frontend solo guarda id y cantidad. */
  private mapItems(r: CartResponse): CartItem[] {
    return r.items.map((i) => ({ productId: i.productId, cantidad: i.cantidad }));
  }
}