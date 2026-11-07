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

  async cargarPedidos(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);

    try {
      const datos = await this.orderService.obtenerPedidos();
      this.pedidos.set(datos || []);
    } catch (err: any) {
      this.error.set(err.message || 'No se pudieron cargar tus pedidos.');
    } finally {
      this.cargando.set(false);
    }
  }
}
