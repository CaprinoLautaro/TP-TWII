import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/productService/product-service';
import { Product } from '../../models/product/product';
import { CartService } from '../../services/cartService/cart-service';

interface Mensaje {
  tipo: 'ok' | 'error';
  texto: string;
}

@Component({
  imports: [RouterLink],
  selector: 'app-stock-manager',
  styleUrl: './stock-manager.css',
  templateUrl: './stock-manager.html',
  standalone: true,
})
export class StockManager {
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);

  readonly productos = this.productService.listaProductos;

  readonly mensaje = signal<Mensaje | null>(null);

  /** Id del producto que está esperando confirmación para borrarse (null = ninguno). */
  readonly confirmandoId = signal<number | null>(null);


  guardar(producto: Product, stockStr: string): void {
    const stock = Number(stockStr);
    if (!Number.isInteger(stock) || stock < 0) {
      this.mensaje.set({ tipo: 'error', texto: 'Ingresá un número entero mayor o igual a 0.' });
      this.limpiarMensaje();
      return;
    }

    this.productService.actualizarStock(producto.id, stock).subscribe({
      next: () => {
        this.mensaje.set({ tipo: 'ok', texto: `Stock de "${producto.nombre}" actualizado.` });
        this.limpiarMensaje();
      },
      error: (e) => {
        this.mensaje.set({ tipo: 'error', texto: e.message });
        this.limpiarMensaje();
      },
    });
  }

  pedirConfirmacion(id: number): void {
    this.confirmandoId.set(id);
  }

  cancelarEliminar(): void {
    this.confirmandoId.set(null);
  }

  eliminar(producto: Product): void {
    this.productService.eliminarProducto(producto.id).subscribe({
      next: () => {
        this.confirmandoId.set(null);
        // El carrito todavía vive en este navegador: si tenía el producto borrado, lo sacamos también.
        if (this.cartService.carrito().some((i) => i.productId === producto.id)) {
          this.cartService.quitar(producto.id).subscribe();
        }
        this.mensaje.set({ tipo: 'ok', texto: `"${producto.nombre}" eliminado.` });
        this.limpiarMensaje();
      },
      error: (e) => {
        this.confirmandoId.set(null);
        this.mensaje.set({ tipo: 'error', texto: e.message });
        this.limpiarMensaje();
      },
    });
  }

  private limpiarMensaje(): void {
    setTimeout(() => this.mensaje.set(null), 3000);
  }
}