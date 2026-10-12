import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/product/product';
import { ProductService } from '../../services/productService/product-service';

@Component({
  imports: [RouterLink],
  selector: 'app-stock-manager',
  styleUrl: './stock-manager.css',
  templateUrl: './stock-manager.html',
})
export class StockManager {
  private readonly productService = inject(ProductService);

  readonly productos = toSignal(this.productService.getProductos(), { initialValue: [] as Product[] });
  readonly mensaje = signal<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  private timeoutMensaje: ReturnType<typeof setTimeout> | undefined;

  /** `valor` es el texto crudo del input: un campo vacío no debe interpretarse como 0. */
  guardar(producto: Product, valor: string) {
    const nuevoStock = valor.trim() === '' ? NaN : Number(valor);

    this.productService.actualizarStock(producto.id, nuevoStock).subscribe({
      next: () =>
        this.mostrarMensaje('ok', `Stock de "${producto.nombre}" actualizado a ${nuevoStock}.`),
      error: (err: Error) => this.mostrarMensaje('error', err.message),
    });
  }

  private mostrarMensaje(tipo: 'ok' | 'error', texto: string) {
    this.mensaje.set({ tipo, texto });
    clearTimeout(this.timeoutMensaje);
    this.timeoutMensaje = setTimeout(() => this.mensaje.set(null), 3500);
  }
}
