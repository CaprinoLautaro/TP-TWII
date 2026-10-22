import { Component, inject } from '@angular/core';
import { CurrencyPipe, DatePipe} from '@angular/common';
import { Router, RouterModule} from '@angular/router';
import { Subject } from 'rxjs';
import { AuthService } from '../../services/authService/auth-service';

import { ProductService } from '../../services/productService/product-service';
import { CartService } from '../../services/cartService/cart-service';

import { Product } from '../../models/product/product';
import { Usuario } from '../../models/user/user';


export interface OrderItemDetail {
  producto: Product;
  cantidad: number;
  subtotal: number;
}

export interface OrderConfirmation{
  orderId: string;
  fecha: Date;
  usuario: Omit<Usuario, 'password'>;
  items: OrderItemDetail[];
  total:number;
  metodoPago: string;
}

@Component({
  imports: [ CurrencyPipe, DatePipe, RouterModule ],
  selector: 'app-order',
  styleUrl: './order.css',
  templateUrl: './order.html',
})
export class Order {

  private readonly cartService = inject(CartService);
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  public fechaActual:Date = new Date();
  public cargando: boolean = false;
  public pedidoConfirmado: OrderConfirmation | null = null;
  public metodoPagoSeleccionado : string = 'Efectivo contra entrega';

  get itemsDetalle(): OrderItemDetail[] {
    const productos = this.productService.listaProductos();
    const resultado : OrderItemDetail[] = [];

    for(const item of this.cartService.carrito()){
      const producto = productos.find(p => p.id === item.productId);
      if(producto){
        resultado.push({
          producto,
          cantidad: item.cantidad,
          subtotal: producto.precio * item.cantidad,
        });
      }
    }
    return resultado;
  }


  get total():number {
    return this.itemsDetalle.reduce((total, item )=> total + item.subtotal, 0);
  }

  get totalUnidades(): number {
    return this.itemsDetalle.reduce((total, item)=> total + item.cantidad, 0);
  }

  get usuarioActual() : Omit<Usuario, 'password'> {
    const usuarioLogeado = this.authService.usuarioActual();
    if(usuarioLogeado){
      return {
        nombre:usuarioLogeado.nombre,
        apellido:usuarioLogeado.apellido,
        email:usuarioLogeado.email,
        direccion:usuarioLogeado.direccion
      }
    }    
    return {
       nombre: 'Juan',
      apellido: 'Perez',
       email: 'juan.perez@ejemplo.com',
       direccion: 'Av.Corrientes 1234, CABA'
     };
    
  }

  seleccionarMetodoPago(metodo: string): void {
    this.metodoPagoSeleccionado = metodo;
  }

  confirmarPedido(): void {
    if(this.itemsDetalle.length == 0){
      return;
    }

    this.pedidoConfirmado = {
      orderId: 'PED-' + Math.floor(100000 + Math.random() * 900000),
      fecha: new Date(),
      usuario: {...this.usuarioActual},
      items: [...this.itemsDetalle],
      total: this.total,
      metodoPago: this.metodoPagoSeleccionado,
    };

    this.cartService.vaciar();
    
  }

    volverAlCatalogo(): void {
      this.router.navigate(['']);
    }

}
