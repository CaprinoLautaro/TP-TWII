import { Component, computed, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cartService/cart-service';
import { ProductService } from '../../services/productService/product-service';
import { Product } from '../../models/product/product';

interface DetalleItem {
  productId: number;
  cantidad: number;
  producto: Product;
  subtotal: number;
}

@Component({
  imports: [CurrencyPipe, RouterLink],
  selector: 'app-cart',
  styleUrl: './cart.css',
  templateUrl: './cart.html',
  standalone: true,
})
export class Cart {
  private readonly cartService = inject(CartService);
  private readonly productService = inject(ProductService);

  readonly carrito = this.cartService.carrito;

  readonly cantidadTotal = this.cartService.cantidadTotal;

  /**
   * Cruza los items del carrito con la lista de productos.
   */
  readonly detalle = computed<DetalleItem[]>(() => {
    const productos = this.productService.listaProductos();
    return this.carrito()
      .map((item) => {
        const producto = productos.find((p) => p.id === item.productId);
        if (!producto) return null;
        return {
          productId: item.productId,
          cantidad: item.cantidad,
          producto,
          subtotal: producto.precio * item.cantidad,
        };
      })
      .filter((x): x is DetalleItem => x !== null);
  });

  /** Total en pesos del carrito. */
  readonly total = computed(() =>
    this.detalle().reduce((acc, d) => acc + d.subtotal, 0),
  );

  /** Indica si el carrito está vacío. */
  readonly vacio = computed(() => this.carrito().length === 0);

  quitar(productId: number): void {
    this.cartService.quitar(productId).subscribe({
      error: (e) => console.error(e.message),
    });
  }

  /** Cambia la cantidad exacta de un producto. Si es 0 o menos, lo elimina. */
  cambiarCantidad(productId: number, cantidad: number): void {
    this.cartService.cambiarCantidad(productId, cantidad).subscribe({
      error: (e) => console.error(e.message),
    });
  }

  /** Suma 1 a la cantidad actual del item. */
  incrementar(productId: number): void {
    const actual = this.carrito().find((i) => i.productId === productId)?.cantidad ?? 0;
    this.cambiarCantidad(productId, actual + 1);
  }

  /** Resta 1 a la cantidad actual. Si llega a 0, quita el item. */
  decrementar(productId: number): void {
    const actual = this.carrito().find((i) => i.productId === productId)?.cantidad ?? 0;
    this.cambiarCantidad(productId, actual - 1);
  }

  confirmarCompra(): void {
    console.log('Confirmar compra — pendiente conectar con backend');
  }
}