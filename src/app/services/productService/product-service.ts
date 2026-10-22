import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { IMAGEN_POR_DEFECTO, NuevoProducto, Product } from '../../models/product/product';
import { validarProducto, validarStock } from '../../models/product/product-rules';
import { PRODUCTOS_INICIALES } from '../../data/productos-iniciales';

const STORAGE_KEY = 'patitas_productos';

/**
 * Hoy los datos viven en memoria (con respaldo en localStorage para que no se pierdan al recargar).
 * El estado se expone como Signal (lectura reactiva) y las escrituras que simulan
 * endpoints POST/PATCH se mantienen como Observables para migrar directo a HttpClient.
 */
@Injectable({ providedIn: 'root' })
export class ProductService {
  /** Estado interno: Signal con la lista de productos. */
  private readonly productos = signal<Product[]>(this.cargar());

  /** Estado expuesto de solo lectura para los componentes. */
  readonly listaProductos = this.productos.asReadonly();

  /** GET /productos/:id — lectura síncrona. Devuelve undefined si no existe. */
  getProducto(id: number): Product | undefined {
    return this.productos().find((p) => p.id === id);
  }

  /** POST /productos */
  crearProducto(datos: NuevoProducto): Observable<Product> {
    const errores = validarProducto(datos);
    if (errores.length > 0) {
      return throwError(() => new Error(errores.join(' ')));
    }

    const lista = this.productos();
    const nombreRepetido = lista.some(
      (p) => p.nombre.trim().toLowerCase() === datos.nombre.trim().toLowerCase(),
    );
    if (nombreRepetido) {
      return throwError(() => new Error('Ya existe un producto con ese nombre.'));
    }

    const nuevo: Product = {
      ...datos,
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion.trim(),
      imagen: datos.imagen?.trim() || IMAGEN_POR_DEFECTO,
      id: Math.max(0, ...lista.map((p) => p.id)) + 1,
    };
    this.guardar([...lista, nuevo]);
    return of(nuevo);
  }

  /**
   * PATCH /productos/:id/stock  (se va a usar al confirmar el pedido)
   * Descuenta unidades y falla si no alcanza el stock.
   */
  descontarStock(id: number, cantidad: number): Observable<Product> {
    const lista = this.productos();
    const producto = lista.find((p) => p.id === id);
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
    const actualizado: Product = { ...producto, stock: producto.stock - cantidad };
    this.guardar(lista.map((p) => (p.id === id ? actualizado : p)));
    return of(actualizado);
  }

  /** PATCH /productos/:id/stock (seteo directo) */
  actualizarStock(id: number, stock: number): Observable<Product> {
    const error = validarStock(stock);
    if (error) {
      return throwError(() => new Error(error));
    }
    const lista = this.productos();
    const producto = lista.find((p) => p.id === id);
    if (!producto) {
      return throwError(() => new Error('El producto no existe.'));
    }
    const actualizado: Product = { ...producto, stock };
    this.guardar(lista.map((p) => (p.id === id ? actualizado : p)));
    return of(actualizado);
  }

  private guardar(lista: Product[]): void {
    this.productos.set(lista);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    } catch {
      // Sin localStorage seguimos funcionando solo en memoria.
    }
  }

  private cargar(): Product[] {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      if (guardado) {
        const lista = JSON.parse(guardado) as Product[];
        if (Array.isArray(lista) && lista.length > 0) return lista;
      }
    } catch {
      // Datos corruptos o sin acceso: arrancamos con los iniciales.
    }
    return PRODUCTOS_INICIALES;
  }
}