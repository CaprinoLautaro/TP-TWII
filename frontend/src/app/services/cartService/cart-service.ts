import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from '../authService/auth-service';
import { CartItem, CartItemResponse, CartResponse } from '../../models/cart/cart.types';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private readonly items = signal<CartItem[]>([]);
  readonly carrito = this.items.asReadonly();
  readonly cantidadTotal = computed(() =>
    this.items().reduce((acc, i) => acc + i.cantidad, 0),
  );

  constructor() {
    // El carrito persiste en la DB entre sesiones: pertenece al usuario, no a la sesión.
    // Al loguearse se carga; al cerrar sesión se limpia la Signal local (sin tocar la DB).
    effect(() => {
      if (this.auth.estaLogueado()) {
        this.cargar();
      } else {
        this.items.set([]);
      }
    });
  }

  cargar(): void {
    this.http.get<CartResponse>('/api/cart').subscribe({
      next: (r) => this.items.set(this.mapItems(r)),
      error: () => this.items.set([]),
    });
  }

  agregar(productId: number, cantidad = 1): Observable<CartResponse> {
    return this.http
      .post<CartResponse>('/api/cart/items', { productId, cantidad })
      .pipe(tap((r) => this.items.set(this.mapItems(r))));
  }

  cambiarCantidad(productId: number, cantidad: number): Observable<CartResponse> {
    return this.http
      .patch<CartResponse>(`/api/cart/items/${productId}`, { cantidad })
      .pipe(tap((r) => this.items.set(this.mapItems(r))));
  }

  quitar(productId: number): Observable<CartResponse> {
    return this.http
      .delete<CartResponse>(`/api/cart/items/${productId}`)
      .pipe(tap((r) => this.items.set(this.mapItems(r))));
  }

  /** Limpia la Signal local. El carrito del backend se conserva. */
  vaciar(): void {
    this.items.set([]);
  }

  /** El backend devuelve items con producto; el frontend solo guarda id y cantidad. */
  private mapItems(r: CartResponse): CartItem[] {
    return r.items.map((item: CartItemResponse) => ({
      productId: item.productId,
      cantidad: item.cantidad,
    }));
  }
}