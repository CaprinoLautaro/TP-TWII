import { Component, inject, signal, OnInit, computed } from '@angular/core'; 
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
export class Order implements OnInit{ 
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  public readonly errorMensaje = signal<string | null>(null);

  readonly itemsDetalle = this.orderService.itemsDetalle;
  readonly total = this.orderService.total;
  readonly totalUnidades = this.orderService.totalUnidades;
  readonly pedidoConfirmado = this.orderService.pedidoConfirmado;
  readonly usuarioActual = computed(() => this.orderService.getUsuarioActual());

  public fechaActual: Date = new Date();
  public cargando = signal<boolean>(false);

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

  // Formmulario reactivo con validaciones para los datos de la tarjeta
  public readonly pagoForm = this.fb.group({
    numeroTarjeta: ['', [Validators.required, this.numeroTarjetaValidator()]],
    nombreTitular: ['', [Validators.required, Validators.minLength(3)]],
    vencimiento: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/)]],
    cvv: ['', [Validators.required, this.cvvValidator()]],
    dniTitular: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
  });

  // Al iniciar, verifica que haya un usuario logeado
  ngOnInit(): void {
    // Si el usuario no esta autenticado, redirigir al catalogo
    if (!this.usuarioActual()) {
      this.router.navigate(['/']);
    }
  }

  // Limpia el comprobante confirmado y vuelve al inicio
  volverAlCatalogo(): void {
    this.orderService.limpiarPedido();
    this.router.navigate(['/']);
  }

// Tarjeta 

  // Devuelve la URL del logo segun la marca detectada o uno generico si falla la imagen
  public get logoTarjeta(): string | null {
    const tipo = this.tipoTarjeta();
    if (!tipo) return null;
    if (!this.logoOk()) return this.logoGenerico;
    return this.logoPorTipo[tipo] ?? this.logoGenerico;
  }

  // Si falla la carga del icono de la marca, habilita el logo generico de respaldo
  public logoBroken(): void {
    this.logoOk.set(false);
  }

  // Detecta la marca de la tarjeta por sus primeros digitos y revalida numero y CVV
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

  // Valida que la tarjeta tenga 15 digitos (Amex) o 16 digitos (Visa, Mastercard, Discover)
  private numeroTarjetaValidator(): ValidatorFn {
    return (ctrl: AbstractControl): ValidationErrors | null => {
      const limpio = (ctrl.value ?? '').toString().replace(/\D/g, '');
      if (!limpio) return null;
      const largo = this.tipoTarjeta() === 'american-express' ? 15 : 16;
      return new RegExp(`^\\d{${largo}}$`).test(limpio) ? null : { tarjetaInvalida: true };
    };
  }

  // Valida que el CVV tenga 4 digitos (Amex) o 3 digitos (Visa, Mastercard, Discover)
  private cvvValidator(): ValidatorFn {
    return (ctrl: AbstractControl): ValidationErrors | null => {
      const valor = (ctrl.value ?? '').toString();
      if (!valor) return null;
      const largo = this.tipoTarjeta() === 'american-express' ? 4 : 3;
      return new RegExp(`^\\d{${largo}}$`).test(valor) ? null : { cvvInvalido: true };
    };
  }


  // Valida el formulario, extrae los ultimos 4 digitos de la tarjeta y envia el pedido al backend
  confirmarPedido(): void {
    this.errorMensaje.set(null);

    if (this.pagoForm.invalid) {
      this.pagoForm.markAllAsTouched();
      this.errorMensaje.set('Por favor completa todos los datos de la tarjeta correctamente.');
      return;
    }

    const numTarjeta = (this.pagoForm.get('numeroTarjeta')?.value || '').replace(/\D/g, '');
    const nombreMarca = (this.tipoTarjeta() ?? 'Tarjeta').toUpperCase();
    const infoTarjeta = `${nombreMarca} ****${numTarjeta.slice(-4)}`;

    this.cargando.set(true);

    this.orderService.confirmarPedido('Tarjeta / Débito', infoTarjeta).subscribe({
      next: () => {
        this.cargando.set(false);
      },
      error: (err: Error) => {
        this.errorMensaje.set(err.message);
        this.cargando.set(false);
      }
    });
  }
}