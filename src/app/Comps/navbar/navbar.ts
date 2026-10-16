import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../services/cartService/cart-service';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-navbar',
  styleUrl: './navbar.css',
  templateUrl: './navbar.html',
  standalone: true,
})
export class Navbar {
  usuarioLogueado = false;
  nombreUsuario = 'Usuario';
  private readonly cartService = inject(CartService);

  readonly cantidadCarrito = this.cartService.cantidadTotal;

  readonly menuAbierto = signal(false);

  toggleMenu(): void {
    this.menuAbierto.update((v) => !v);
  }

  cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  cerrarSesion(): void {
    // Pendiente: conectar con AuthService.logout()
    this.usuarioLogueado = false;
    this.cerrarMenu();
  }
}