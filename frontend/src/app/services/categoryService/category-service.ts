import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { API_URL } from '../../config/api.config';
import { Categoria } from '../../models/product/product';

/**
 * Categorías de producto. Viven en la base de datos (GET /api/categories es público y
 * POST /api/categories es solo para admin). Se guardan en un Signal para que el formulario
 * de productos las lea de forma síncrona.
 */
@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);

  private readonly lista = signal<Categoria[]>([]);

  /** true si la última carga falló (backend sin migrar, apagado o desactualizado). */
  readonly errorCarga = signal(false);

  /** Solo los nombres, listos para un <select>. */
  readonly nombres = computed(() => this.lista().map((c) => c.nombre));

  constructor() {
    this.cargar();
  }

  /** GET /api/categories */
  cargar(): void {
    this.http.get<Categoria[]>(`${API_URL}/categories`).subscribe({
      next: (cats) => {
        this.lista.set(cats);
        this.errorCarga.set(false);
      },
      error: () => this.errorCarga.set(true),
    });
  }

  /** POST /api/categories — devuelve la categoría creada (con el nombre tal como quedó guardado). */
  crear(nombre: string): Observable<Categoria> {
    return this.http.post<Categoria>(`${API_URL}/categories`, { nombre: nombre.trim() }).pipe(
      tap((nueva) => this.lista.update((cats) => [...cats, nueva])),
      catchError((err) => {
        const mensaje =
          err instanceof HttpErrorResponse && err.status === 0
            ? 'No se pudo conectar con el servidor.'
            : typeof err?.error?.error === 'string'
              ? err.error.error
              : 'No se pudo crear la categoría.';
        return throwError(() => new Error(mensaje));
      }),
      map((nueva) => nueva),
    );
  }
}
