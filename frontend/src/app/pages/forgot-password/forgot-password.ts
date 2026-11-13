import { Component, inject, signal} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private readonly http = inject(HttpClient);

  mensaje = signal('');
  esError = signal(false);
  bloqueado = signal(false);
  enviando = signal(false);

  forgotForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  onSubmit() {
    if (this.bloqueado() || this.enviando()) {
      return;
    }

    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    const email = this.forgotForm.value.email!;

    this.enviando.set(true);
    this.mensaje.set('');

    this.http
      .post<{ message: string }>('http://localhost:3000/api/auth/forgot-password', { email })
      .pipe(
        finalize(() => {
          this.enviando.set(false);
        }),
      )
      .subscribe({
        next: (respuesta) => {
          this.mensaje.set(respuesta.message);
          this.esError.set(false);
        },
        error: (error) => {
          this.esError.set(true);

          if (error.status === 429) {
            this.bloqueado.set(true);
            this.mensaje.set('Demasiadas solicitudes. Intentá nuevamente más tarde.');
          } else {
            this.mensaje.set('No se pudo enviar la solicitud. Intentá nuevamente.');
          }
        },
      });
  }
}
