import { Component, inject, signal, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../services/orderService/order-service';

@Component({
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterModule],
  selector: 'app-mis-ordenes',
  templateUrl: './mis-ordenes.html',
  styleUrl: './mis-ordenes.css'
})
export class MisOrdenes implements OnInit {
  private readonly orderService = inject(OrderService);

  public readonly pedidos = signal<any[]>([]);
  public readonly cargando = signal<boolean>(true);
  public readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarPedidos();
  }

  cargarPedidos(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.orderService.obtenerPedidos().subscribe({
      next: (datos) => {
        this.pedidos.set(datos || []);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'No se pudieron cargar tus pedidos.');
        this.cargando.set(false);
      }
    });
  }
}