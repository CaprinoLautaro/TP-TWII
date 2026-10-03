import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-navbar',
  styleUrl: './navbar.css',
  templateUrl: './navbar.html',
})
export class Navbar {
  usuarioLogueado = false;
  nombreUsuario = 'Usuario';
  cantidadCarrito = 0;

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
