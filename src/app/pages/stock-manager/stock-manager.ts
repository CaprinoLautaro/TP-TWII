import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/productService/product-service';
import { Product } from '../../models/product/product';

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

  readonly productos = this.productService.listaProductos;

  readonly mensaje = signal<Mensaje | null>(null);


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

  private limpiarMensaje(): void {
    setTimeout(() => this.mensaje.set(null), 3000);
  }
}