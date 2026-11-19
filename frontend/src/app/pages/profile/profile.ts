import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/authService/auth-service';
import { ToastService } from '../../services/toastService/toast-service';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-profile',
  styleUrl: './profile.css',
  templateUrl: './profile.html',
})
export class Profile {
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  private readonly toastService = inject(ToastService);

  readonly form = this.fb.nonNullable.group({
    nombre: [this.auth.usuarioActual()?.nombre ?? '', [Validators.required, Validators.pattern(/\S/)]],
    apellido: [this.auth.usuarioActual()?.apellido ?? '', [Validators.required, Validators.pattern(/\S/)]],
    direccion: [this.auth.usuarioActual()?.direccion ?? '', [Validators.required, Validators.pattern(/\S/)]],
  });

  constructor() {
    if (this.auth.esAdmin()) this.form.disable(); // el admin es solo lectura
  }

  invalido(campo: string): boolean {
    const c = this.form.get(campo);
    return !!c && c.touched && c.invalid;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.auth.actualizarPerfil(this.form.getRawValue()).subscribe({
      next: () => this.toastService.exito('Perfil actualizado correctamente.'),
      error: (err: Error) => this.toastService.error(err.message),
    });
  }
}
