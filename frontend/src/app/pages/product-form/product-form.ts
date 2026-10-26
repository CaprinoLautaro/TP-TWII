import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CATEGORIAS, NuevoProducto } from '../../models/product/product';
import { ProductService } from '../../services/productService/product-service';
import { ImageService } from '../../services/imageService/image-service';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-product-form',
  styleUrl: './product-form.css',
  templateUrl: './product-form.html',
})
export class ProductForm {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly imageService = inject(ImageService);


  readonly categorias = CATEGORIAS;
  readonly mensajeError = signal('');
  readonly creado = signal(false);
  readonly imagenPreview = signal('');
  readonly errorImagen = signal('');

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: ['', [Validators.required, Validators.minLength(10)]],
    clasificacion: ['', [Validators.required]],
    precio: [null as number | null, [Validators.required, Validators.min(1)]],
    stock: [null as number | null, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
    imagen: [''],
  });

  invalido(campo: string): boolean {
    const c = this.form.get(campo);
    return !!c && c.touched && c.invalid;
  }

  onSubmit(): void {
    this.mensajeError.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const datos: NuevoProducto = {
      nombre: v.nombre,
      descripcion: v.descripcion,
      clasificacion: v.clasificacion,
      precio: Number(v.precio),
      stock: Number(v.stock),
      imagen: this.imagenPreview(),
    };

    this.productService.crearProducto(datos).subscribe({
      next: () => {
        this.creado.set(true);
        setTimeout(() => this.router.navigate(['/']), 1200);
      },
      error: (err: Error) => this.mensajeError.set(err.message),
    });
  }

  onArchivoSeleccionado(evento: Event) {
  const input = evento.target as HTMLInputElement;
  const archivo = input.files?.[0];
  if (!archivo) return;

  this.errorImagen.set('');
  this.imageService.subirImagen(archivo).subscribe({
    next: (url) => this.imagenPreview.set(url),
    error: (err: Error) => {
      this.errorImagen.set(err.message);
      this.imagenPreview.set('');
      input.value = '';
    },
  });
}

quitarImagen(input: HTMLInputElement) {
  this.imagenPreview.set('');
  input.value = '';
}
}
