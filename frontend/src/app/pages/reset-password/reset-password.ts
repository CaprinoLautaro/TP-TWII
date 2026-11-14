import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  resetForm = new FormGroup({
    password: new FormControl('', [
      Validators.required,
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/),
    ]),

    confirmPassword: new FormControl('', [Validators.required]),
  });

  onSubmit() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const password = this.resetForm.value.password;
    const confirmPassword = this.resetForm.value.confirmPassword;

    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      alert('El enlace de recuperación no es válido.');
      return;
    }

    this.http
      .post<{ message: string }>('http://localhost:3000/api/auth/reset-password', {
        token,
        newPassword: password,
      })
      .subscribe({
        next: (respuesta) => {
          alert(respuesta.message);
          this.router.navigate(['/signin']);
        },
        error: (error) => {
          alert(
            error.error?.message ||
              'No se pudo cambiar la contraseña. El enlace podría haber vencido.',
          );
        },
      });
  }
}
