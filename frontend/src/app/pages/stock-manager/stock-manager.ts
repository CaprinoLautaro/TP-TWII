import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/productService/product-service';
import { Product } from '../../models/product/product';
import { CartService } from '../../services/cartService/cart-service';
import { ToastService } from '../../services/toastService/toast-service';

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
  private readonly toastService = inject(ToastService);

  readonly productos = this.productService.listaProductos;

  /** Id del producto que está esperando confirmación para borrarse (null = ninguno). */
  readonly confirmandoId = signal<number | null>(null);


  guardar(producto: Product, stockStr: string): void {
    const stock = Number(stockStr);
    if (!Number.isInteger(stock) || stock < 0) {
      this.toastService.error('Ingresá un número entero mayor o igual a 0.');
      return;
    }

    this.productService.actualizarStock(producto.id, stock).subscribe({
      next: () => {
        this.toastService.exito(`Stock de "${producto.nombre}" actualizado.`);
      },
      error: (e) => {
        this.toastService.error(e.message);
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
        this.toastService.exito(`"${producto.nombre}" eliminado.`);
      },
      error: (e) => {
        this.confirmandoId.set(null);
        this.toastService.error(e.message);
      },
    });
  }
}