import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { stockDisponible } from '../../models/product/product-rules';
import { ProductService } from '../../services/productService/product-service';
import { CartService } from '../../services/cartService/cart-service';

@Component({
  imports: [RouterLink, CurrencyPipe],
  selector: 'app-product-detail',
  styleUrl: './product-detail.css',
  templateUrl: './product-detail.html',
})
export class ProductDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);

  /** Id de la URL (/producto/:id). */
  private readonly id = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('id')))),
    { initialValue: Number(this.route.snapshot.paramMap.get('id')) },
  );

  /** null = el producto no existe. Se actualiza solo si cambia el stock. */
  readonly producto = computed(() => this.productService.getProducto(this.id()) ?? null);

  readonly cantidad = signal(1);
  readonly mensaje = signal<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  readonly enCarrito = computed(
    () => this.cartService.carrito().find((i) => i.productId === this.id())?.cantidad ?? 0,
  );

  readonly disponible = computed(() => {
    const p = this.producto();
    return p ? stockDisponible(p.stock, this.enCarrito()) : 0;
  });

  private timeoutMensaje: ReturnType<typeof setTimeout> | undefined;

  sumar() {
    if (this.cantidad() < this.disponible()) this.cantidad.update((c) => c + 1);
  }

  restar() {
    if (this.cantidad() > 1) this.cantidad.update((c) => c - 1);
  }

  agregar() {
    const p = this.producto();
    if (!p || this.disponible() === 0) return;

    const cantidad = this.cantidad();
    this.cartService.agregar(p.id, cantidad).subscribe({
      next: () => {
        this.mostrarMensaje('ok', `Agregaste ${cantidad} × "${p.nombre}" al carrito`);
        this.cantidad.set(1);
      },
      error: (err: Error) => this.mostrarMensaje('error', err.message),
    });
  }

  private mostrarMensaje(tipo: 'ok' | 'error', texto: string) {
    this.mensaje.set({ tipo, texto });
    clearTimeout(this.timeoutMensaje);
    this.timeoutMensaje = setTimeout(() => this.mensaje.set(null), 3500);
  }
}
