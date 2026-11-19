import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  tipo: 'ok' | 'error' | 'info';
  texto: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  
  private contadorId = 0;

  mostrar(texto: string, tipo: 'ok' | 'error' | 'info' = 'info') {
    const id = this.contadorId++;
    this._toasts.update(actuales => [...actuales, { id, tipo, texto }]);
    setTimeout(() => this.cerrar(id), 3000); // Auto-cierre
  }

  exito(texto: string) { this.mostrar(texto, 'ok'); }
  error(texto: string) { this.mostrar(texto, 'error'); }
  info(texto: string) { this.mostrar(texto, 'info'); }

  cerrar(id: number) {
    this._toasts.update(actuales => actuales.filter(t => t.id !== id));
  }
}