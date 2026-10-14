import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CurrencyPipe, DatePipe} from '@angular/common';
import { Router, RouterModule} from '@angular/router';
import { Subject } from 'rxjs';
import { Product } from '../../models/product/product';
import { Usuario } from '../../models/user/user';


export interface OrderItemDetaill {
  producto: Product;
  cantidad: number;
  subtotal: number;
}

export interface OrderConfirmation{
  orderId: string;
  fecha: Date;
  usuario: Omit<Usuario, 'password'>;
  items: OrderItemDetaill[];
  total:number;
}

@Component({
  imports: [ CurrencyPipe, DatePipe, RouterModule ],
  selector: 'app-order',
  styleUrl: './order.css',
  templateUrl: './order.html',
})
export class Order implements OnInit, OnDestroy{

  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  public fechaActual:Date = new Date();
  public cargando: boolean = false;
  public pedidoConfirmado: OrderConfirmation | null = null;

  // Por el momento, productos de prueba
  public itemsDetalle: OrderItemDetaill[] = [
    {
      producto: {
        id: 1,
        nombre: 'Collar Ajustable con Chapita',
        descripcion: 'Nylon reforzado, disponible en varios colores.',
        clasificacion: 'Perros',
        precio: 42500,
        stock: 15,
        imagen: 'img/productos/collar-ajustable-con-chapita.png'
      },
      cantidad: 1,
      subtotal: 42500
    },
    {
      producto: {
        id: 2,
        nombre: 'Pelota de Goma para Perros',
        descripcion: 'Resistente a mordidas, rebota y flota en el agua.',
        clasificacion: 'Perros',
        precio: 18900,
        stock: 20,
        imagen: 'img/productos/pelota-para-perros.jpg'
      },
      cantidad: 2,
      subtotal: 37800
    },
    {
      producto: {
        id: 3,
        nombre: 'Shampoo Hipoalergénico',
        descripcion: 'Para perros y gatos de piel sensible, 500ml.',
        clasificacion: 'Accesorios',
        precio: 12400,
        stock: 65,
        imagen: 'img/productos/shampoo-hipoalergenico.jpg'
      },
      cantidad: 1,
      subtotal: 12400
    }

  ];

  ngOnInit(): void {

  }

  ngOnDestroy(): void{
    this.destroy$.next();
    this.destroy$.complete();
  }

  get total():number {
    return this.itemsDetalle.reduce((total, item )=> total + item.subtotal, 0);
  }

  get totalUnidades(): number {
    return this.itemsDetalle.reduce((total, item)=> total + item.cantidad, 0);
  }

  get usuarioActual() {
    return {
      nombre: 'Juan',
      apellido: 'Perez',
      email: 'juan.perez@ejemplo.com',
      direccion: 'Av.Corrientes 1234, CABA'
    };
  }

  confirmarPedido(): void {
    if(this.itemsDetalle.length == 0){
      alert('No podes confirmar un pedido sin productos.');
      return;
    }

    this.pedidoConfirmado = {
      orderId: 'PED-' + Math.floor(100000 + Math.random() * 900000),
      fecha: new Date(),
      usuario: {...this.usuarioActual},
      items: [...this.itemsDetalle],
      total: this.total
    };
  }

    volverAlCatalogo(): void {
      this.router.navigate(['']);
    }

}
