import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { API_URL as API_BASE_URL } from '../../config/api.config';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { CartService } from '../cartService/cart-service';
import { ProductService } from '../productService/product-service';
import { AuthService } from '../authService/auth-service';
import { Product } from '../../models/product/product';
import { Usuario } from '../../models/user/user';

// Detalle de cada item del carrito con su producto y subtotal
export interface OrderItemDetail {
  producto: Product;
  cantidad: number;
  subtotal: number;
}

// Estructura del comprobante que se muestra al confirmar el pedido
export interface OrderConfirmation {
  orderId: string;
  fecha: Date;
  usuario: Omit<Usuario, 'password'>;
  items: OrderItemDetail[];
  total: number;
  metodoPago: string;
  ultimosDigitosTarjeta?: string;
}

const API_URL = `${API_BASE_URL}/orders`;

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly cartService = inject(CartService);
  private readonly productService = inject(ProductService);
  private readonly auth = inject(AuthService);

  private readonly _pedidoConfirmado = signal<OrderConfirmation | null>(null);
  readonly pedidoConfirmado = this._pedidoConfirmado.asReadonly();

  // Combina los ids del carrito con los datos completos del catalogo para calcular subtotales
  readonly itemsDetalle = computed<OrderItemDetail[]>(() => {
    const productos = this.productService.listaProductos();
    return this.cartService.carrito()
      .map(item => {
        const producto = productos.find(p => p.id === item.productId);
        return producto
          ? { producto, cantidad: item.cantidad, subtotal: producto.precio * item.cantidad }
          : null;
      })
      .filter((item): item is OrderItemDetail => item !== null);
  });

  // Suma el subtotal de todos los items para obtener el total a pagar
  readonly total = computed(() =>
    this.itemsDetalle().reduce((acc, item) => acc + item.subtotal, 0)
  );

  // Suma las cantidades para saber el total de unidades del pedido
  readonly totalUnidades = computed(() =>
    this.itemsDetalle().reduce((acc, item) => acc + item.cantidad, 0)
  );


  // Devuelve los datos del usuario actual sin incluir la contra
  getUsuarioActual(): Omit<Usuario, 'password'> | null {
    const u = this.auth.usuarioActual();
    if (!u) return null;
    return {
      nombre: u.nombre,
      apellido: u.apellido,
      email: u.email,
      direccion: u.direccion,
    };
  }

 // GET /api/orders Obtiene el historial de pedidos del usuario logueado
  obtenerPedidos(): Observable<any[]> {
    return this.http.get<any[]>(API_URL).pipe(
      catchError(err => this.manejarError(err, 'Error al obtener el historial de pedidos.'))
    );
  }

  //  GET /api/orders/:id  Obtiene el detalle de un pedido puntual por su ID
  obtenerPedidoPorId(id: number): Observable<any> {
    return this.http.get<any>(`${API_URL}/${id}`).pipe(
      catchError(err => this.manejarError(err, 'Error al obtener el pedido.'))
    );
  }

  // Resetea el comprobante confirmado para poder iniciar un nuevo pedido
  limpiarPedido(): void {
    this._pedidoConfirmado.set(null);
  }

  // POST /api/orders Envia el pedido al backend, vacia el carrito y actualiza el stock
  confirmarPedido(metodoPago: string, infoTarjeta?: string): Observable<OrderConfirmation> {
    const items = this.itemsDetalle();

    if (items.length === 0) {
      return throwError(() => new Error('No hay productos en el carrito.'));
    }

    // Extraigo los ultimos 4 digitos de la tarjeta para guardar en el backend
    const ultimosDigitos = infoTarjeta?.match(/\d{4}$/)?.[0];

    const payload = {
      usuario: this.getUsuarioActual(),
      items: items.map(it => ({
        productId: it.producto.id,
        cantidad: it.cantidad
      })),
      metodoPago,
      ultimosDigitosTarjeta: ultimosDigitos
    };

    return this.http.post<OrderConfirmation>(API_URL, payload).pipe(
      map(ordenBackend => ({
        ...ordenBackend,
        items: [...items],
        ...(infoTarjeta ? { ultimosDigitosTarjeta: infoTarjeta } : {})
      })),
      tap(ordenFinal => {
        this.cartService.vaciar();
        this._pedidoConfirmado.set(ordenFinal);
        this.productService.cargar(); 
      }),
      catchError(err => this.manejarError(err, 'Error al procesar el pedido.'))
    );
  }

  // Maneja los errores de las peticiones HTTP y devuelve un observable con el mensaje adecuado
  private manejarError(err: HttpErrorResponse, porDefecto: string) {
    if (err.status === 0) {
      return throwError(() => new Error('No se pudo conectar con el servidor.'));
    }
    const mensaje = err.error?.error ?? err.error?.message ?? porDefecto;
    return throwError(() => new Error(mensaje));
  }
}