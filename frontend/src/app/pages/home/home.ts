import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CartService } from '../../services/cartService/cart-service';
import { ProductService } from '../../services/productService/product-service';
import { AuthService } from '../../services/authService/auth-service';
import { ProductCardComponent } from '../../Comps/product-card-component/product-card-component';
import { Mascota, Product } from '../../models/product/product';

type FiltroMascota = 'TODOS' | 'PERRO' | 'GATO';

/** Máximo de filas de productos por página. */
const FILAS_POR_PAGINA = 2;

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

  // ---- Filtros (se aplican sobre la lista completa que ya trajo el servicio) ----
  readonly mascotaSeleccionada = signal<FiltroMascota>('TODOS');
  readonly precioMin = signal<number | null>(null);
  readonly precioMax = signal<number | null>(null);

  readonly hayFiltros = computed(
    () =>
      this.categoriaSeleccionada() !== 'Todas' ||
      this.mascotaSeleccionada() !== 'TODOS' ||
      this.precioMin() !== null ||
      this.precioMax() !== null,
  );

  readonly productosFiltrados = computed(() => {
    const categoria = this.categoriaSeleccionada();
    const mascota = this.mascotaSeleccionada();
    const min = this.precioMin();
    const max = this.precioMax();

    return this.productos().filter((p) => {
      if (categoria !== 'Todas' && p.clasificacion !== categoria) return false;
      // "Perros" muestra los de perros y los que sirven para ambos (igual con gatos)
      if (mascota !== 'TODOS' && p.mascota !== mascota && p.mascota !== ('AMBOS' as Mascota)) return false;
      if (min !== null && p.precio < min) return false;
      if (max !== null && p.precio > max) return false;
      return true;
    });
  });

  // ---- Paginación: la grilla tiene como máximo 2 filas ----
  /** Columnas según el ancho de pantalla (tiene que coincidir con los media queries de home.css). */
  readonly columnas = signal(this.calcularColumnas());
  readonly productosPorPagina = computed(() => this.columnas() * FILAS_POR_PAGINA);
  private readonly paginaPedida = signal(1);

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.productosFiltrados().length / this.productosPorPagina())),
  );
  /** Página actual, siempre dentro del rango (si los filtros dejan menos páginas, se ajusta sola). */
  readonly paginaActual = computed(() => Math.min(this.paginaPedida(), this.totalPaginas()));
  readonly paginas = computed(() => Array.from({ length: this.totalPaginas() }, (_, i) => i + 1));

  readonly productosDePagina = computed(() => {
    const por = this.productosPorPagina();
    const inicio = (this.paginaActual() - 1) * por;
    return this.productosFiltrados().slice(inicio, inicio + por);
  });

  @HostListener('window:resize')
  onResize(): void {
    this.columnas.set(this.calcularColumnas());
  }

  private calcularColumnas(): number {
    const ancho = typeof window === 'undefined' ? 1200 : window.innerWidth;
    if (ancho >= 1100) return 4;
    if (ancho >= 800) return 3;
    if (ancho >= 520) return 2;
    return 1;
  }

  irAPagina(n: number): void {
    this.paginaPedida.set(Math.min(Math.max(1, n), this.totalPaginas()));
    document.querySelector('.catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---- Acciones de los filtros (todas vuelven a la página 1) ----
  seleccionarMascota(m: FiltroMascota): void {
    this.mascotaSeleccionada.set(m);
    this.paginaPedida.set(1);
  }

  /** Convierte lo escrito en el input en número (o null si está vacío o es inválido). */
  private aPrecio(valor: string): number | null {
    const n = Number(valor);
    return valor.trim() === '' || !Number.isFinite(n) || n < 0 ? null : n;
  }

  cambiarPrecioMin(valor: string): void {
    this.precioMin.set(this.aPrecio(valor));
    this.paginaPedida.set(1);
  }

  cambiarPrecioMax(valor: string): void {
    this.precioMax.set(this.aPrecio(valor));
    this.paginaPedida.set(1);
  }

  limpiarFiltros(): void {
    this.categoriaSeleccionada.set('Todas');
    this.mascotaSeleccionada.set('TODOS');
    this.precioMin.set(null);
    this.precioMax.set(null);
    this.paginaPedida.set(1);
  }

  reintentar(): void {
    this.productService.cargar();
  }

  seleccionarCategoria(categoria: string): void {
    this.categoriaSeleccionada.set(categoria);
    this.paginaPedida.set(1);
  }

  cantidadEnCarrito(productId: number): number {
    return this.carrito().find((i) => i.productId === productId)?.cantidad ?? 0;
  }

  /** Si el usuario no está logueado, redirige al login sin hacer la request (evita el 401). */
  agregarAlCarrito(producto: Product): void {
    if (!this.auth.estaLogueado()) {
      this.router.navigate(['/signin']);
      return;
    }

    this.cartService.agregar(producto.id).subscribe({
      next: () => this.mostrarMensaje('ok', `"${producto.nombre}" agregado al carrito.`),
      error: (e) => this.mostrarMensaje('error', e.message),
    });
  }

  private mostrarMensaje(tipo: Mensaje['tipo'], texto: string): void {
    this.mensaje.set({ tipo, texto });
    setTimeout(() => this.mensaje.set(null), 3000);
  }
}