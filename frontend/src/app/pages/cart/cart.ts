import { Component, computed, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
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
  private readonly router = inject(Router);

  readonly carrito = this.cartService.carrito;
  readonly cantidadTotal = this.cartService.cantidadTotal;
  readonly vacio = computed(() => this.carrito().length === 0);

  /** Cruza los items del carrito con el catálogo para mostrar el detalle. */
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

  readonly total = computed(() =>
    this.detalle().reduce((acc, d) => acc + d.subtotal, 0),
  );

  /**
   * Items cuya cantidad supera el stock actual.
   * Puede pasar si el stock cambió después de agregar al carrito.
   */
  readonly itemsConStockInsuficiente = computed(() =>
    this.detalle().filter((d) => d.cantidad > d.producto.stock),
  );

  /** Hay al menos un item con stock insuficiente. */
  readonly hayProblemasDeStock = computed(
    () => this.itemsConStockInsuficiente().length > 0,
  );

  /** ¿Este item ya alcanzó el stock disponible? (para deshabilitar el "+"). */
  esLimiteStock(item: DetalleItem): boolean {
    return item.cantidad >= item.producto.stock;
  }

  quitar(productId: number): void {
    this.cartService.quitar(productId).subscribe({
      error: (e) => console.error(e.message),
    });
  }

  cambiarCantidad(productId: number, cantidad: number): void {
    this.cartService.cambiarCantidad(productId, cantidad).subscribe({
      error: (e) => console.error(e.message),
    });
  }

  incrementar(productId: number): void {
    const item = this.detalle().find((d) => d.productId === productId);
    if (!item || this.esLimiteStock(item)) return;
    this.cambiarCantidad(productId, item.cantidad + 1);
  }

  decrementar(productId: number): void {
    const item = this.detalle().find((d) => d.productId === productId);
    if (!item) return;
    this.cambiarCantidad(productId, item.cantidad - 1);
  }

  confirmarCompra(): void {
    if (this.hayProblemasDeStock()) return;
    this.router.navigate(['/order']);
  }
}