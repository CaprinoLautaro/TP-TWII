import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NuevoProducto } from '../../models/product/product';
import { CategoryService } from '../../services/categoryService/category-service';
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
  private readonly categoryService = inject(CategoryService);

  readonly categorias = this.categoryService.nombres;
  readonly errorCategorias = this.categoryService.errorCarga;

  reintentarCategorias(): void {
    this.categoryService.cargar();
  }

  // Alta de una categoría nueva (solo llega acá el admin: la ruta del formulario está protegida)
  readonly agregandoCategoria = signal(false);
  readonly nuevaCategoria = signal('');
  readonly errorCategoria = signal('');
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

  abrirNuevaCategoria(): void {
    this.errorCategoria.set('');
    this.nuevaCategoria.set('');
    this.agregandoCategoria.set(true);
  }

  cancelarNuevaCategoria(): void {
    this.agregandoCategoria.set(false);
    this.errorCategoria.set('');
  }

  guardarNuevaCategoria(): void {
    this.errorCategoria.set('');
    this.categoryService.crear(this.nuevaCategoria()).subscribe({
      next: (cat) => {
        this.form.controls.clasificacion.setValue(cat.nombre); // queda elegida
        this.agregandoCategoria.set(false);
      },
      error: (err: Error) => this.errorCategoria.set(err.message),
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
