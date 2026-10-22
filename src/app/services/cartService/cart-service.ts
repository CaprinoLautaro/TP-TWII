import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { validarCantidad } from '../../models/product/product-rules';
import { ProductService } from '../productService/product-service';

/** El carrito guarda solo id y cantidad (no una copia del producto): el precio y el stock salen siempre de ProductService. */
export interface CartItem {
  productId: number;
  cantidad: number;
}

const STORAGE_KEY = 'patitas_carrito';

/**
 * Estado expuesto como Signal (lectura reactiva).
 * Las operaciones que simulan endpoints HTTP (agregar, quitar, cambiarCantidad)
 * se mantienen como Observables para migrar directo a HttpClient.
 *
 * Métodos pensados como futuros endpoints:
 * agregar -> POST /carrito/items, quitar -> DELETE /carrito/items/:id,
 * cambiarCantidad -> PATCH /carrito/items/:id.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly productService = inject(ProductService);

  /** Estado interno: Signal con los items del carrito. */
  private readonly items = signal<CartItem[]>(this.cargar());

  /** Estado expuesto de solo lectura para los componentes. */
  readonly carrito = this.items.asReadonly();

  /** Total de unidades, para el contador del navbar. */
  readonly cantidadTotal = computed(() =>
    this.items().reduce((acc, i) => acc + i.cantidad, 0)
  );

  /** POST /carrito/items — falla con un mensaje claro si se supera el stock. */
  agregar(productId: number, cantidad = 1): Observable<CartItem[]> {
    const producto = this.productService.getProducto(productId);
    if (!producto) {
      return throwError(() => new Error('El producto no existe.'));
    }

    const actual = this.items().find((i) => i.productId === productId)?.cantidad ?? 0;
    const error = validarCantidad(producto.stock, actual, cantidad);
    if (error) {
      return throwError(() => new Error(error));
    }

    const items = actual
      ? this.items().map((i) =>
          i.productId === productId ? { ...i, cantidad: i.cantidad + cantidad } : i,
        )
      : [...this.items(), { productId, cantidad }];

    this.guardar(items);
    return of(items);
  }

  /** PATCH /carrito/items/:id — setea la cantidad exacta. Si es 0 o menos, elimina el item. */
  cambiarCantidad(productId: number, cantidad: number): Observable<CartItem[]> {
    if (cantidad <= 0) {
      return this.quitar(productId);
    }

    const producto = this.productService.getProducto(productId);
    if (!producto) {
      return throwError(() => new Error('El producto no existe.'));
    }

    const error = validarCantidad(producto.stock, 0, cantidad);
    if (error) {
      return throwError(() => new Error(error));
    }

    const items = this.items().map((i) =>
      i.productId === productId ? { ...i, cantidad } : i,
    );
    this.guardar(items);
    return of(items);
  }

  /** DELETE /carrito/items/:id */
  quitar(productId: number): Observable<CartItem[]> {
    const existe = this.items().some((i) => i.productId === productId);
    if (!existe) {
      return throwError(() => new Error('El producto no está en el carrito.'));
    }
    const items = this.items().filter((i) => i.productId !== productId);
    this.guardar(items);
    return of(items);
  }

 vaciar(): void {
    this.guardar([]);
  }

  private guardar(items: CartItem[]): void {
    this.items.set(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Sin localStorage seguimos solo en memoria.
    }
  }

  private cargar(): CartItem[] {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      if (guardado) {
        const items = JSON.parse(guardado) as CartItem[];
        if (Array.isArray(items)) return items;
      }
    } catch {
      // Datos corruptos: carrito vacío.
    }
    return [];
  }
}