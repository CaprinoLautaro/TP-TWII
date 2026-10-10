import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Product } from '../../models/product/product';
import { stockDisponible } from '../../models/product/product-rules';
import { CurrencyPipe } from '@angular/common';

@Component({
  imports: [CurrencyPipe],
  selector: 'app-product-card-component',
  styleUrl: './product-card-component.css',
  templateUrl: './product-card-component.html',
})
export class ProductCardComponent {
  @Input() product!: Product;
  /** Unidades de este producto que ya están en el carrito. */
  @Input() enCarrito = 0;
  @Output() agregar = new EventEmitter<Product>();

  get agotado(): boolean {
    return this.product.stock <= 0;
  }

  get disponible(): number {
    return stockDisponible(this.product.stock, this.enCarrito);
  }

  get pocasUnidades(): boolean {
    return !this.agotado && this.product.stock <= 3;
  }

  onAgregar() {
    if (this.disponible > 0) {
      this.agregar.emit(this.product);
    }
  }
}
