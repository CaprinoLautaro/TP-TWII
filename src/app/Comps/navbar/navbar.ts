import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../services/cartService/cart-service';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-navbar',
  styleUrl: './navbar.css',
  templateUrl: './navbar.html',
})
export class Navbar {
  usuarioLogueado = false;
  nombreUsuario = 'Usuario';
  private readonly cartService = inject(CartService);
  readonly cantidadCarrito = toSignal(this.cartService.cantidadTotal(), { initialValue: 0 });

  menuAbierto = false;

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu() {
    this.menuAbierto = false;
  }

  cerrarSesion() {
    // Pendiente: conectar con AuthService.logout()
    this.usuarioLogueado = false;
    this.cerrarMenu();
  }
}
