import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CATEGORIAS, Product } from '../../models/product/product';
import { ProductCardComponent } from '../../Comps/product-card-component/product-card-component';
import { ProductService } from '../../services/productService/product-service';
import { CartService } from '../../services/cartService/cart-service';

@Component({
  imports: [ProductCardComponent, RouterLink],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);

  readonly categorias = ['Todas', ...CATEGORIAS];
  readonly categoriaSeleccionada = signal('Todas');
  readonly mensaje = signal<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  private readonly productos = toSignal(this.productService.getProductos(), { initialValue: [] as Product[] });
  private readonly carrito = toSignal(this.cartService.getCarrito(), { initialValue: [] });

  readonly productosFiltrados = computed(() => {
    const categoria = this.categoriaSeleccionada();
    const lista = this.productos();
    return categoria === 'Todas' ? lista : lista.filter((p) => p.clasificacion === categoria);
  });

  private timeoutMensaje: ReturnType<typeof setTimeout> | undefined;

  seleccionarCategoria(categoria: string) {
    this.categoriaSeleccionada.set(categoria);
  }

  cantidadEnCarrito(productId: number): number {
    return this.carrito().find((i) => i.productId === productId)?.cantidad ?? 0;
  }

  agregarAlCarrito(producto: Product) {
    this.cartService.agregar(producto.id).subscribe({
      next: () => this.mostrarMensaje('ok', `"${producto.nombre}" agregado al carrito`),
      error: (err: Error) => this.mostrarMensaje('error', err.message),
    });
  }

  private mostrarMensaje(tipo: 'ok' | 'error', texto: string) {
    this.mensaje.set({ tipo, texto });
    clearTimeout(this.timeoutMensaje);
    this.timeoutMensaje = setTimeout(() => this.mensaje.set(null), 3500);
  }
}
