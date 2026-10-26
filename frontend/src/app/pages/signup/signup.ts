import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../services/authService/auth-service';


@Component({
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  standalone: true,
  selector: 'app-signup',
  styleUrl: './signup.css',
  templateUrl: './signup.html',
})
export class Signup {
  registroForm: FormGroup;
  mensajeError: string = '';
  registroExitoso: boolean = false;

  constructor(
  private fb: FormBuilder,
  private auth: AuthService,
  private router: Router,
) {
    this.registroForm = this.fb.group({
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      direccion: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8), this.validarComplejidadPassword]]
    })
  }

  // Validar complejidad contraseña

  validarComplejidadPassword(control: AbstractControl): ValidationErrors | null {
    const valor = control.value || '';
    const tieneMayuscula = /[A-Z]/.test(valor);
    const tieneMinuscula = /[a-z]/.test(valor);
    const tieneNumero = /[0-9]/.test(valor);

    const esValida = tieneMayuscula && tieneMinuscula && tieneNumero;
    return esValida ? null : { passwordDebil: true };
  }

onSubmit(): void {
  this.mensajeError = '';
  if (this.registroForm.invalid) {
    this.registroForm.markAllAsTouched();
    return;
  }
  const { nombre, apellido, email, direccion, password } = this.registroForm.value;
  this.auth.registrar({ nombre, apellido, email, direccion, password }).subscribe({
    next: () => this.router.navigate(['/']), // queda con la sesión iniciada
    error: (err: Error) => (this.mensajeError = err.message),
  });
}
}
