import { Component, OnInit, OnDestroy, inject, Signal, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CartService } from '../../services/cartService/cart-service';
import { ProductService } from '../../services/productService/product-service';
import { AuthService } from '../../services/authService/auth-service';
import { Product } from '../../models/product/product';
import { Usuario } from '../../models/user/user';
import creditCardType from 'credit-card-type';


export interface OrderItemDetail {
  producto: Product;
  cantidad: number;
  subtotal: number;
}

export interface OrderConfirmation {
  orderId: string;
  fecha: Date;
  usuario: Omit<Usuario, 'password'>;
  items: OrderItemDetail[];
  total: number;
  ultimosDigitosTarjeta: string;
}

@Component({
  selector: 'app-order',
  imports: [CurrencyPipe, DatePipe, RouterModule, ReactiveFormsModule],
  templateUrl: './order.html',
  styleUrl: './order.css',
})
export class Order implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly cartService = inject(CartService);
  private readonly productService = inject(ProductService);
  private readonly authService = inject(AuthService);
  private readonly destroy$ = new Subject<void>();

  public fechaActual: Date = new Date();
  public cargando = signal<boolean>(false);
  public errorPago: string | null = null;
  public pedidoConfirmado = signal<OrderConfirmation | null>(null);
  public tipoTarjeta = signal<string | null>(null);
  public logoOk = signal(true);

  /** Logo de la marca detectada (CDN icons8) con fallback genérico. */
  private readonly logoGenerico = 'https://img.icons8.com/color/96/bank-card-front.png';
  private readonly logoPorTipo: Record<string, string> = {
    'visa': 'https://img.icons8.com/color/96/visa.png',
    'mastercard': 'https://img.icons8.com/color/96/mastercard.png',
    'american-express': 'https://img.icons8.com/color/96/amex.png',
    'maestro': 'https://img.icons8.com/color/96/maestro.png',
    'diners-club': 'https://img.icons8.com/color/96/diners-club.png',
    'discover': 'https://img.icons8.com/color/96/discover.png',
    'jcb': 'https://img.icons8.com/color/96/jcb.png',
    'unionpay': 'https://img.icons8.com/color/96/unionpay.png',
    'cabal': 'https://img.icons8.com/color/96/bank-card-back.png',
    'naranja': 'https://img.icons8.com/color/96/bank-card-back.png',
    'hipercard': 'https://img.icons8.com/color/96/bank-card-back.png',
    'elo': 'https://img.icons8.com/color/96/bank-card-back.png',
    'shopping': 'https://img.icons8.com/color/96/bank-card-back.png',
    'argencard': 'https://img.icons8.com/color/96/bank-card-back.png',
  };

  private claveTarjeta(): string {
    return (this.tipoTarjeta() ?? '').toLowerCase().replace(/\s/g, '-');
  }

  public get logoTarjeta(): string | null {
    const tipo = this.tipoTarjeta();
    if (!tipo) return null;
    if (!this.logoOk()) return this.logoGenerico;
    return this.logoPorTipo[this.claveTarjeta()] ?? this.logoGenerico;
  }

  public logoBroken(): void {
    this.logoOk.set(false);
  }



  public itemsDetalle: OrderItemDetail[] = [];
  public pagoForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.cargarItemsCarrito();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.pagoForm = this.fb.group({
      numeroTarjeta: ['', [Validators.required, this.numeroTarjetaValidator()]],
      nombreTitular: ['', [Validators.required, Validators.minLength(3)]],
      vencimiento: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/)]],
      cvv: ['', [Validators.required, this.cvvValidator()]],
      dniTitular: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
    });
  }

  /** Largo según la marca detectada: Amex 15 dígitos, resto 16. */
  private numeroTarjetaValidator(): ValidatorFn {
    return (ctrl: AbstractControl): ValidationErrors | null => {
      const limpio = (ctrl.value ?? '').toString().replace(/\D/g, '');
      if (!limpio) return null; // el required cubre el vacío
      const largo = this.claveTarjeta() === 'american-express' ? 15 : 16;
      return new RegExp(`^\\d{${largo}}$`).test(limpio) ? null : { tarjetaInvalida: true };
    };
  }

  /** CVV según la marca detectada: Amex 4 dígitos, resto 3. */
  private cvvValidator(): ValidatorFn {
    return (ctrl: AbstractControl): ValidationErrors | null => {
      const valor = (ctrl.value ?? '').toString();
      if (!valor) return null; // el required cubre el vacío
      const largo = this.claveTarjeta() === 'american-express' ? 4 : 3;
      return new RegExp(`^\\d{${largo}}$`).test(valor) ? null : { cvvInvalido: true };
    };
  }

  private cargarItemsCarrito(): void {
    const carritoItems = this.cartService.carrito();
    this.itemsDetalle = carritoItems
      .map((item) => {
        const prod = this.productService.getProducto(item.productId);
        if (!prod) return null;
        return {
          producto: prod,
          cantidad: item.cantidad,
          subtotal: prod.precio * item.cantidad,
        };
      })
      .filter((i): i is OrderItemDetail => i !== null);
  }

  get total(): number {
    return this.itemsDetalle.reduce((acc, item) => acc + item.subtotal, 0);
  }

  get totalUnidades(): number {
    return this.itemsDetalle.reduce((acc, item) => acc + item.cantidad, 0);
  }

  get usuarioActual() {
    const user = this.authService.usuarioActual();
    return user || {
      nombre: 'Invitado',
      apellido: 'Patitas',
      email: 'invitado@patitas.com',
      direccion: 'Sin dirección registrada',
    };
  }

 procesarPago(): void {
  if (this.itemsDetalle.length === 0) {
    alert('No podés confirmar un pedido sin productos.');
    return;
  }

  if (this.pagoForm.invalid) {
    this.pagoForm.markAllAsTouched();
    return;
  }

  this.cargando.set(true);
  this.errorPago = null;

  setTimeout(() => {
    this.cargando.set(false);
    const numTarjeta = (this.pagoForm.get('numeroTarjeta')?.value || '').replace(/\D/g, '');
    const ultimosDigitos = `${this.tipoTarjeta() ?? 'Tarjeta'} ****${numTarjeta.slice(-4)}`;

    this.pedidoConfirmado.set({
      orderId: 'PED-' + Math.floor(100000 + Math.random() * 900000),
      fecha: new Date(),
      usuario: { ...this.usuarioActual },
      items: [...this.itemsDetalle],
      total: this.total,
      ultimosDigitosTarjeta: ultimosDigitos,
    });
  }, 2000);
}

  volverAlCatalogo(): void {
    this.router.navigate(['']);
  }

  onTarjetaInput(v: string): void {
    const limpio = (v ?? '').replace(/\D/g, '');
    if (!limpio) {
      this.tipoTarjeta.set(null);
      return;
    }
    const matches = creditCardType(limpio);
    if (matches.length > 0) {
      // sticky: si matchean varias (ej "4"), creditCardType ya ordena por prioridad
      this.tipoTarjeta.set(matches[0].niceType);
      this.logoOk.set(true);
    }
    // si matches es vacio (prefijo trampa ej "306") conservamos el ultimo tipo
    this.pagoForm.get('numeroTarjeta')?.updateValueAndValidity();
    this.pagoForm.get('cvv')?.updateValueAndValidity();
  }
  
}