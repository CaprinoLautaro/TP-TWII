import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CartService } from '../../services/cartService/cart-service';
import { ProductService } from '../../services/productService/product-service';
import { AuthService } from '../../services/authService/auth-service';
import { ProductCardComponent } from '../../Comps/product-card-component/product-card-component';
import { Product } from '../../models/product/product';

interface Mensaje {
  tipo: 'ok' | 'error';
  texto: string;
}

@Component({
  imports: [ProductCardComponent, RouterLink],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
  standalone: true,
})
export class Home {
  private readonly auth = inject(AuthService);
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  readonly esAdmin = this.auth.esAdmin;
  readonly productos = this.productService.listaProductos;
  readonly cargando = this.productService.cargando;
  readonly errorCarga = this.productService.errorCarga;
  readonly carrito = this.cartService.carrito;

  readonly mensaje = signal<Mensaje | null>(null);
  readonly categoriaSeleccionada = signal<string>('Todas');

  readonly categorias = computed<string[]>(() => {
    const unicas = new Set(this.productos().map((p) => p.clasificacion));
    return ['Todas', ...Array.from(unicas)];
  });

  readonly productosFiltrados = computed(() => {
    const categoria = this.categoriaSeleccionada();
    const lista = this.productos();
    return categoria === 'Todas' ? lista : lista.filter((p) => p.clasificacion === categoria);
  });

  reintentar(): void {
    this.productService.cargar();
  }

  seleccionarCategoria(categoria: string): void {
    this.categoriaSeleccionada.set(categoria);
  }

  cantidadEnCarrito(productId: number): number {
    return this.carrito().find((i) => i.productId === productId)?.cantidad ?? 0;
  }

  /**
   * Agrega un producto al carrito. Si el usuario no está logueado,
   * redirige al login sin hacer la request (evita el 401 innecesario).
   */
  agregarAlCarrito(producto: Product): void {
    if (!this.auth.estaLogueado()) {
      this.router.navigate(['/signin']);
      return;
    }

    this.cartService.agregar(producto.id).subscribe({
      next: () => {
        this.mensaje.set({ tipo: 'ok', texto: `"${producto.nombre}" agregado al carrito.` });
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