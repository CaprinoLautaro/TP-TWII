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

  // Signals para manejar la lista de ordenes, el estado de carga y posibles errores
  public readonly pedidos = signal<any[]>([]);
  public readonly cargando = signal<boolean>(true);
  public readonly error = signal<string | null>(null);

  // Al cargar el componente, pide el historial de pedidos 
  ngOnInit(): void {
    this.cargarPedidos();
  }

  // Consulta las ordenes del usuario y actualiza los signals de la vista
  cargarPedidos(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.orderService.obtenerPedidos().subscribe({
      next: (datos) => {
        this.pedidos.set(datos ?? []);
        this.cargando.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message || 'No se pudieron cargar tus pedidos.');
        this.cargando.set(false);
      }
    });
  }
}