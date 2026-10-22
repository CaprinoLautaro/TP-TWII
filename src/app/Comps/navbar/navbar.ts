import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../services/cartService/cart-service';
import { AuthService } from '../../services/authService/auth-service';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-navbar',
  styleUrl: './navbar.css',
  templateUrl: './navbar.html',
  standalone: true,
})
export class Navbar {
  private readonly auth = inject(AuthService);
private readonly router = inject(Router);
readonly usuario = this.auth.usuarioActual;
readonly estaLogueado = this.auth.estaLogueado;
readonly esAdmin = this.auth.esAdmin;
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

cerrarSesion() {
  this.auth.logout();
  this.cerrarMenu();
  this.router.navigate(['/']);
}
}
