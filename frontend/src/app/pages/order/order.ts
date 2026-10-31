import { Component, inject, signal } from '@angular/core'; 
import { CurrencyPipe, DatePipe, UpperCasePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { OrderService } from '../../services/orderService/order-service';

@Component({
  standalone: true,
  imports: [CurrencyPipe, DatePipe, UpperCasePipe, RouterModule, ReactiveFormsModule],
  selector: 'app-order',
  styleUrl: './order.css',
  templateUrl: './order.html',
})
export class Order { 
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  public readonly errorMensaje = signal<string | null>(null);

  readonly itemsDetalle = this.orderService.itemsDetalle;
  readonly total = this.orderService.total;
  readonly totalUnidades = this.orderService.totalUnidades;
  readonly pedidoConfirmado = this.orderService.pedidoConfirmado;
  readonly usuarioActual = signal(this.orderService.getUsuarioActual());

  public fechaActual: Date = new Date();
  public cargando = signal<boolean>(false);
  public metodoPagoSeleccionado = signal<string>('Efectivo contra entrega');

  // Estado de la tarjeta
  public tipoTarjeta = signal<string | null>(null);
  public logoOk = signal<boolean>(true);

  // Logos según la marca
  private readonly logoGenerico = 'https://img.icons8.com/color/96/bank-card-front.png';
  private readonly logoPorTipo: Record<string, string> = {
    'visa': 'https://img.icons8.com/color/96/visa.png',
    'mastercard': 'https://img.icons8.com/color/96/mastercard.png',
    'american-express': 'https://img.icons8.com/color/96/amex.png',
    'maestro': 'https://img.icons8.com/color/96/maestro.png',
    'discover': 'https://img.icons8.com/color/96/discover.png',
  };

  public readonly pagoForm = this.fb.group({
    numeroTarjeta: ['', [Validators.required, this.numeroTarjetaValidator()]],
    nombreTitular: ['', [Validators.required, Validators.minLength(3)]],
    vencimiento: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/)]],
    cvv: ['', [Validators.required, this.cvvValidator()]],
    dniTitular: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
  });

  seleccionarMetodoPago(metodo: string): void {
    this.metodoPagoSeleccionado.set(metodo);
    this.errorMensaje.set(null);
  }

  volverAlCatalogo(): void {
    this.orderService.limpiarPedido();
    this.router.navigate(['/']);
  }

// Tarjeta 

  public get logoTarjeta(): string | null {
    const tipo = this.tipoTarjeta();
    if (!tipo) return null;
    if (!this.logoOk()) return this.logoGenerico;
    return this.logoPorTipo[tipo] ?? this.logoGenerico;
  }

  public logoBroken(): void {
    this.logoOk.set(false);
  }

  onTarjetaInput(valor: string): void {
    const limpio = (valor ?? '').replace(/\D/g, '');

    if (!limpio) {
      this.tipoTarjeta.set(null);
      return;
    }

    if (/^4/.test(limpio)) {
      this.tipoTarjeta.set('visa');
    } else if (/^(5[1-5]|2[2-7])/.test(limpio)) {
      this.tipoTarjeta.set('mastercard');
    } else if (/^3[47]/.test(limpio)) {
      this.tipoTarjeta.set('american-express');
    } else if (/^(6011|65|64[4-9])/.test(limpio)) {
      this.tipoTarjeta.set('discover');
    } else {
      this.tipoTarjeta.set('tarjeta');
    }

    this.logoOk.set(true);
    this.pagoForm.get('numeroTarjeta')?.updateValueAndValidity();
    this.pagoForm.get('cvv')?.updateValueAndValidity();
  }

  private numeroTarjetaValidator(): ValidatorFn {
    return (ctrl: AbstractControl): ValidationErrors | null => {
      const limpio = (ctrl.value ?? '').toString().replace(/\D/g, '');
      if (!limpio) return null;
      const largo = this.tipoTarjeta() === 'american-express' ? 15 : 16;
      return new RegExp(`^\\d{${largo}}$`).test(limpio) ? null : { tarjetaInvalida: true };
    };
  }

  private cvvValidator(): ValidatorFn {
    return (ctrl: AbstractControl): ValidationErrors | null => {
      const valor = (ctrl.value ?? '').toString();
      if (!valor) return null;
      const largo = this.tipoTarjeta() === 'american-express' ? 4 : 3;
      return new RegExp(`^\\d{${largo}}$`).test(valor) ? null : { cvvInvalido: true };
    };
  }

  
  confirmarPedido(): void {
    this.errorMensaje.set(null);
    let infoTarjeta: string | undefined = undefined;

    if (this.metodoPagoSeleccionado() === 'Tarjeta / Débito') {
      if (this.pagoForm.invalid) {
        this.pagoForm.markAllAsTouched();
        this.errorMensaje.set('Por favor completa todos los datos de la tarjeta correctamente.');
        return;
      }

      const numTarjeta = (this.pagoForm.get('numeroTarjeta')?.value || '').replace(/\D/g, '');
      const nombreMarca = (this.tipoTarjeta() ?? 'Tarjeta').toUpperCase();
      infoTarjeta = `${nombreMarca} ****${numTarjeta.slice(-4)}`;
    }

    this.cargando.set(true);

    this.orderService.confirmarPedido(this.metodoPagoSeleccionado(), infoTarjeta).subscribe({
      next: () => {
        this.cargando.set(false);
      },
      error: (err: any) => {
        this.cargando.set(false);
        const mensaje = err.error?.error || err.error?.message || err.message || 'Ocurrió un error al procesar el pedido';
        this.errorMensaje.set(mensaje);
      }
    });
  }
}