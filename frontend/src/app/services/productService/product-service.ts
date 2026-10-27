import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { API_URL } from '../../config/api.config';
import { IMAGEN_POR_DEFECTO, NuevoProducto, Product } from '../../models/product/product';
import { validarProducto, validarStock } from '../../models/product/product-rules';

/** Convierte un error HTTP en un texto para mostrarle al usuario (el backend manda { error: '...' }). */
function mensajeDeError(err: unknown, porDefecto: string): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'No se pudo conectar con el servidor. ¿Está corriendo el backend?';
    }
    const mensaje = err.error?.error;
    if (typeof mensaje === 'string') return mensaje;
  }
  return porDefecto;
}

/** Si un producto no tiene imagen, usamos la de por defecto. */
function conImagen(p: Product): Product {
  return { ...p, imagen: p.imagen?.trim() || IMAGEN_POR_DEFECTO };
}

/**
 * Los productos viven en la base de datos del backend (PostgreSQL).
 * Acá se guarda una copia en un Signal para que home, carrito, detalle y pedido
 * la lean de forma síncrona, y se actualiza cada vez que el backend confirma un cambio.
 * Las escrituras devuelven Observables, que es lo que ya usaban los componentes.
 */
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);

  /** Estado interno: Signal con la lista de productos. */
  private readonly productos = signal<Product[]>([]);

  /** Estado expuesto de solo lectura para los componentes. */
  readonly listaProductos = this.productos.asReadonly();

  /** true mientras se espera la primera respuesta del backend. */
  readonly cargando = signal(true);

  /** Mensaje si no se pudo cargar la lista (por ejemplo, backend apagado). */
  readonly errorCarga = signal<string | null>(null);

  constructor() {
    this.cargar();
  }

  /** GET /api/products — trae la lista completa. Se puede volver a llamar para reintentar. */
  cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);

    this.http.get<Product[]>(`${API_URL}/products`).subscribe({
      next: (lista) => {
        this.productos.set(lista.map(conImagen));
        this.cargando.set(false);
      },
      error: (err) => {
        this.errorCarga.set(mensajeDeError(err, 'No se pudieron cargar los productos.'));
        this.cargando.set(false);
      },
    });
  }

  /** Lectura síncrona sobre la copia local. Devuelve undefined si no existe (o si todavía no cargó). */
  getProducto(id: number): Product | undefined {
    return this.productos().find((p) => p.id === id);
  }

  /** POST /api/products */
  crearProducto(datos: NuevoProducto): Observable<Product> {
    const errores = validarProducto(datos);
    if (errores.length > 0) {
      return throwError(() => new Error(errores.join(' ')));
    }

    const body = {
      ...datos,
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion.trim(),
      imagen: datos.imagen?.trim() ?? '',
    };

    return this.http.post<Product>(`${API_URL}/products`, body).pipe(
      map(conImagen),
      tap((nuevo) => this.productos.update((lista) => [...lista, nuevo])),
      catchError((err) =>
        throwError(() => new Error(mensajeDeError(err, 'No se pudo crear el producto.'))),
      ),
    );
  }

  /** PATCH /api/products/:id/stock (seteo directo del stock) */
  actualizarStock(id: number, stock: number): Observable<Product> {
    const error = validarStock(stock);
    if (error) {
      return throwError(() => new Error(error));
    }

    return this.http.patch<Product>(`${API_URL}/products/${id}/stock`, { stock }).pipe(
      map(conImagen),
      tap((actualizado) =>
        this.productos.update((lista) => lista.map((p) => (p.id === id ? actualizado : p))),
      ),
      catchError((err) =>
        throwError(() => new Error(mensajeDeError(err, 'No se pudo actualizar el stock.'))),
      ),
    );
  }

  /** DELETE /api/products/:id — falla con 409 si el producto ya figura en pedidos. */
  eliminarProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/products/${id}`).pipe(
      tap(() => this.productos.update((lista) => lista.filter((p) => p.id !== id))),
      catchError((err) =>
        throwError(() => new Error(mensajeDeError(err, 'No se pudo eliminar el producto.'))),
      ),
    );
  }

  /**
   * Descuenta unidades y falla si no alcanza el stock.
   * Por ahora usa el mismo PATCH de arriba. Cuando exista el módulo de pedidos del backend,
   * el descuento va a hacerse allá, dentro de la misma transacción que crea el pedido.
   */
  descontarStock(id: number, cantidad: number): Observable<Product> {
    const producto = this.getProducto(id);
    if (!producto) {
      return throwError(() => new Error('El producto no existe.'));
    }
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      return throwError(() => new Error('La cantidad debe ser al menos 1.'));
    }
    if (cantidad > producto.stock) {
      return throwError(
        () => new Error(`Stock insuficiente de "${producto.nombre}": quedan ${producto.stock}.`),
      );
    }
    return this.actualizarStock(id, producto.stock - cantidad);
  }
}
