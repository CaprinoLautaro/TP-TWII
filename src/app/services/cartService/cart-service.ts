import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { validarCantidad } from '../../models/product/product-rules';
import { ProductService } from '../productService/product-service';

/** El carrito guarda solo id y cantidad (no una copia del producto): el precio y el stock salen siempre de ProductService. */
export interface CartItem {
  productId: number;
  cantidad: number;
}

const STORAGE_KEY = 'patitas_carrito';

/**
 * Métodos pensados como futuros endpoints:
 * getCarrito -> GET /carrito, agregar -> POST /carrito/items.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly productService = inject(ProductService);
  private readonly items$ = new BehaviorSubject<CartItem[]>(this.cargar());

  /** GET /carrito */
  getCarrito(): Observable<CartItem[]> {
    return this.items$.asObservable();
  }

  /** Total de unidades, para el contador del navbar. */
  cantidadTotal(): Observable<number> {
    return this.items$.pipe(map((items) => items.reduce((acc, i) => acc + i.cantidad, 0)));
  }

  /** POST /carrito/items — falla con un mensaje claro si se supera el stock. */
  agregar(productId: number, cantidad = 1): Observable<CartItem[]> {
    return this.productService.getProducto(productId).pipe(
      take(1),
      switchMap((producto) => {
        const actual = this.items$.value.find((i) => i.productId === productId)?.cantidad ?? 0;
        const error = validarCantidad(producto.stock, actual, cantidad);
        if (error) {
          return throwError(() => new Error(error));
        }
        const items = actual
          ? this.items$.value.map((i) =>
              i.productId === productId ? { ...i, cantidad: i.cantidad + cantidad } : i,
            )
          : [...this.items$.value, { productId, cantidad }];
        this.guardar(items);
        return [items];
      }),
    );
  }

  private guardar(items: CartItem[]): void {
    this.items$.next(items);
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
