import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors} from '@angular/forms';

@Component({
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true,
  selector: 'app-signup',
  styleUrl: './signup.css',
  templateUrl: './signup.html',
})
export class Signup {
  registroForm: FormGroup;
  mensajeError: string = '';
  registroExitoso: boolean = false;

  constructor(private fb: FormBuilder) {
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
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }
    console.log('Datos Enviados: ', this.registroForm.value)
  }
}
