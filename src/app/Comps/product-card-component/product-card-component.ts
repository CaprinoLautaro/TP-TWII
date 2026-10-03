import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Product } from '../../models/product/product';
import { CurrencyPipe } from '@angular/common';

@Component({
  imports: [CurrencyPipe],
  selector: 'app-product-card-component',
  styleUrl: './product-card-component.css',
  templateUrl: './product-card-component.html',
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Output() agregar = new EventEmitter<Product>();

  onAgregar() {
    this.agregar.emit(this.product);
  }
}
