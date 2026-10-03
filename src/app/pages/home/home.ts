import { Component } from '@angular/core';
import { Product } from '../../models/product/product';
import { ProductCardComponent } from '../../Comps/product-card-component/product-card-component';

@Component({
  imports: [ProductCardComponent],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {
  categoriaSeleccionada = 'Todas';
  categorias = ['Todas', 'Alimento', 'Juguetes', 'Accesorios', 'Higiene', 'Camas'];

  productos: Product[] = [
    {
      id: 1,
      nombre: 'Alimento Premium para Perros 15kg',
      descripcion: 'Balanceado adulto con pollo y arroz, razas medianas y grandes.',
      clasificacion: 'Alimento',
      precio: 48000,
      imagen: 'https://loremflickr.com/400/300/dogfood?lock=1',
    },
    {
      id: 2,
      nombre: 'Alimento para Gatos 7,5kg',
      descripcion: 'Con salmón y omega 3, ideal para pelo brillante.',
      clasificacion: 'Alimento',
      precio: 36000,
      imagen: 'https://loremflickr.com/400/300/cat,food?lock=2',
    },
    {
      id: 3,
      nombre: 'Pelota de Goma para Perros',
      descripcion: 'Resistente a mordidas, rebota y flota en el agua.',
      clasificacion: 'Juguetes',
      precio: 5500,
      imagen: 'https://loremflickr.com/400/300/dog,ball?lock=3',
    },
    {
      id: 4,
      nombre: 'Rascador para Gatos',
      descripcion: 'Torre de sisal con plataforma y ratón colgante.',
      clasificacion: 'Juguetes',
      precio: 29000,
      imagen: 'https://loremflickr.com/400/300/cat,toy?lock=4',
    },
    {
      id: 5,
      nombre: 'Collar Ajustable con Chapita',
      descripcion: 'Nylon reforzado, disponible en varios colores.',
      clasificacion: 'Accesorios',
      precio: 7800,
      imagen: 'https://loremflickr.com/400/300/dog,collar?lock=5',
    },
    {
      id: 6,
      nombre: 'Correa Retráctil 5m',
      descripcion: 'Con freno de seguridad y mango ergonómico.',
      clasificacion: 'Accesorios',
      precio: 14500,
      imagen: 'https://loremflickr.com/400/300/dog,leash?lock=6',
    },
    {
      id: 7,
      nombre: 'Shampoo Hipoalergénico',
      descripcion: 'Para perros y gatos de piel sensible, 500ml.',
      clasificacion: 'Higiene',
      precio: 9200,
      imagen: 'https://loremflickr.com/400/300/dog,bath?lock=7',
    },
    {
      id: 8,
      nombre: 'Cama Acolchada Mediana',
      descripcion: 'Lavable, base antideslizante, ideal para perros y gatos.',
      clasificacion: 'Camas',
      precio: 32000,
      imagen: 'https://loremflickr.com/400/300/pet,bed?lock=8',
    },
  ];

  get productosFiltrados(): Product[] {
    if (this.categoriaSeleccionada === 'Todas') {
      return this.productos;
    }
    return this.productos.filter((p) => p.clasificacion === this.categoriaSeleccionada);
  }

  seleccionarCategoria(categoria: string) {
    this.categoriaSeleccionada = categoria;
  }

  agregarAlCarrito(producto: Product) {
    alert(`"${producto.nombre}" agregado al carrito`);
  }
}
