import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { IMAGEN_POR_DEFECTO, NuevoProducto, Product } from '../../models/product/product';
import { validarProducto } from '../../models/product/product-rules';

const STORAGE_KEY = 'patitas_productos';

const PRODUCTOS_INICIALES: Product[] = [
  { id: 1, nombre: 'Alimento Premium para Perros 15kg', descripcion: 'Balanceado adulto con pollo y arroz, razas medianas y grandes.', clasificacion: 'Alimento', precio: 48000, stock: 10, imagen: '/img/productos/comida-para-perros.jpg' },
  { id: 2, nombre: 'Alimento para Gatos 7,5kg', descripcion: 'Con salmón y omega 3, ideal para pelo brillante.', clasificacion: 'Alimento', precio: 36000, stock: 8, imagen: 'img/productos/comida-para-gato.jpg' },
  { id: 3, nombre: 'Pelota de Goma para Perros', descripcion: 'Resistente a mordidas, rebota y flota en el agua.', clasificacion: 'Juguetes', precio: 5500, stock: 25, imagen: 'img/productos/pelota-para-perros.jpg' },
  { id: 4, nombre: 'Rascador para Gatos', descripcion: 'Torre de sisal con plataforma y ratón colgante.', clasificacion: 'Juguetes', precio: 29000, stock: 2, imagen: 'img/productos/rascador-para-gatos.png' },
  { id: 5, nombre: 'Collar Ajustable con Chapita', descripcion: 'Nylon reforzado, disponible en varios colores.', clasificacion: 'Accesorios', precio: 7800, stock: 15, imagen: 'img/productos/collar-ajustable-con-chapita.png' },
  { id: 6, nombre: 'Correa Retráctil 5m', descripcion: 'Con freno de seguridad y mango ergonómico.', clasificacion: 'Accesorios', precio: 14500, stock: 0, imagen: 'img/productos/correa.png' },
  { id: 7, nombre: 'Shampoo Hipoalergénico', descripcion: 'Para perros y gatos de piel sensible, 500ml.', clasificacion: 'Higiene', precio: 9200, stock: 12, imagen: 'img/productos/shampoo-hipoalergenico.jpg' },
  { id: 8, nombre: 'Cama Acolchada Mediana', descripcion: 'Lavable, base antideslizante, ideal para perros y gatos.', clasificacion: 'Camas', precio: 32000, stock: 5, imagen: 'img/productos/colchon-mediano.jpg' },
];

/**
 * Hoy los datos viven en memoria (con respaldo en localStorage para que no se pierdan al recargar).
 * Todos los métodos devuelven Observables y se parecen a endpoints REST:
 * cuando esté el backend solo cambia el interior de cada método por un this.http.get/post.
 */
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly productos$ = new BehaviorSubject<Product[]>(this.cargar());

  /** GET /productos */
  getProductos(): Observable<Product[]> {
    return this.productos$.asObservable();
  }

  /** GET /productos/:id */
  getProducto(id: number): Observable<Product> {
    const producto = this.productos$.value.find((p) => p.id === id);
    return producto
      ? this.productos$.pipe(map((lista) => lista.find((p) => p.id === id) ?? producto))
      : throwError(() => new Error('El producto no existe.'));
  }

  /** POST /productos */
  crearProducto(datos: NuevoProducto): Observable<Product> {
    const errores = validarProducto(datos);
    if (errores.length > 0) {
      return throwError(() => new Error(errores.join(' ')));
    }

    const lista = this.productos$.value;
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
    return new Observable<Product>((obs) => {
      obs.next(nuevo);
      obs.complete();
    });
  }

  /**
   * PATCH /productos/:id/stock  (se va a usar al confirmar el pedido)
   * Descuenta unidades y falla si no alcanza el stock.
   */
  descontarStock(id: number, cantidad: number): Observable<Product> {
    const lista = this.productos$.value;
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
    return new Observable<Product>((obs) => {
      obs.next(actualizado);
      obs.complete();
    });
  }

  private guardar(lista: Product[]): void {
    this.productos$.next(lista);
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
