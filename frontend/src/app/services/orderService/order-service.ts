import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError, tap } from 'rxjs';
import { CartService } from '../cartService/cart-service';
import { ProductService } from '../productService/product-service';
import { AuthService } from '../authService/auth-service';
import { Product } from '../../models/product/product';
import { Usuario } from '../../models/user/user';

export interface OrderItemDetail {
  producto: Product;
  cantidad: number;
  subtotal: number;
}

export interface OrderConfirmation {
  orderId: string;
  fecha: Date;
  usuario: Omit<Usuario, 'password'>;
  items: OrderItemDetail[];
  total: number;
  metodoPago: string;
  ultimosDigitosTarjeta?: string; 
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly cartService = inject(CartService);
  private readonly productService = inject(ProductService);
  private readonly authService = inject(AuthService);

  private readonly apiUrl = 'http://localhost:3000/api/orders';

  private readonly _pedidoConfirmado = signal<OrderConfirmation | null>(null);
  readonly pedidoConfirmado = this._pedidoConfirmado.asReadonly();

  readonly itemsDetalle = computed<OrderItemDetail[]>(() => {
    const productos = this.productService.listaProductos();
    const resultado: OrderItemDetail[] = [];

    for (const item of this.cartService.carrito()) {
      const producto = productos.find(p => p.id === item.productId);
      if (producto) {
        resultado.push({
          producto,
          cantidad: item.cantidad,
          subtotal: producto.precio * item.cantidad,
        });
      }
    }
    return resultado;
  });

  readonly total = computed(() =>
    this.itemsDetalle().reduce((acc, item) => acc + item.subtotal, 0)
  );

  readonly totalUnidades = computed(() =>
    this.itemsDetalle().reduce((acc, item) => acc + item.cantidad, 0)
  );

  getUsuarioActual(): Omit<Usuario, 'password'> {
    const usuarioLogeado = this.authService.usuarioActual?.();
    if (usuarioLogeado) {
      return {
        nombre: usuarioLogeado.nombre,
        apellido: usuarioLogeado.apellido,
        email: usuarioLogeado.email,
        direccion: usuarioLogeado.direccion,
      };
    }
    return {
      nombre: 'Juan',
      apellido: 'Perez',
      email: 'juan.perez@ejemplo.com',
      direccion: 'Av. Corrientes 1234, CABA',
    };
  }


async obtenerPedidos(): Promise<any[]> {
  const auth = this.authService as any;
  const token = (typeof auth?.token === 'function' ? auth.token() : auth?.token)
    || auth?.getToken?.()
    || localStorage.getItem('token')
    || '';

  const response = await fetch(this.apiUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });

  if (!response.ok) {
    throw new Error('Error al obtener el historial de pedidos.');
  }

  return await response.json();
}

  obtenerPedidoPorId(id: number): Observable<any> {
    const token = (this.authService as any).token?.() || localStorage.getItem('token') || '';
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();

    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers });
  }

  limpiarPedido(): void {
    this._pedidoConfirmado.set(null);
  }


  // Metodo para confirmrar el pedido

async confirmarPedido(metodoPago: string, infoTarjeta?: string): Promise<OrderConfirmation> {
  const items = this.itemsDetalle();

  if (items.length === 0) {
    throw new Error('No hay productos en el carrito.');
  }

  const ultimosDigitosTarjeta = infoTarjeta?.match(/\d{4}$/)?.[0];

  const payload = {
    usuario: this.getUsuarioActual(),
    items: items.map(it => ({
      productId: it.producto.id,
      cantidad: it.cantidad
    })),
    metodoPago,
    ultimosDigitosTarjeta
  };

  const auth = this.authService as any;
  const token = (typeof auth?.token === 'function' ? auth.token() : auth?.token)
    || auth?.getToken?.()
    || localStorage.getItem('token')
    || '';

  const response = await fetch(this.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  });

  // En caso de error
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Error al procesar el pedido');
  }

  const ordenConfirmada: OrderConfirmation = await response.json();

  const ordenFinal = {
    ...ordenConfirmada,
    items: [...items],
    total: this.total(),
    ...(infoTarjeta ? { ultimosDigitosTarjeta: infoTarjeta } : {})
  };

  this.cartService.vaciar();
  this._pedidoConfirmado.set(ordenFinal);

  return ordenFinal;
}
}