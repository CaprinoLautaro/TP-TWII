import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { API_URL } from '../../config/api.config';
import { STORAGE_KEYS } from '../../config/storage-keys';
import { Usuario } from '../../models/user/user';

interface UsuarioApi {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  direccion: string;
  rol: 'CLIENTE' | 'ADMIN';
}

interface AuthResponse {
  user: UsuarioApi;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly usuario = signal<Usuario | null>(this.cargarSesion());

  readonly usuarioActual = this.usuario.asReadonly();
  readonly estaLogueado = computed(() => this.usuario() !== null);
  readonly esAdmin = computed(() => this.usuario()?.rol === 'admin');

  get token(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.token);
    } catch {
      return null;
    }
  }

  registrar(datos: Omit<Usuario, 'id' | 'rol'>): Observable<Usuario> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/signup`, datos).pipe(
      tap((res) => this.iniciarSesion(res.user, res.token)),
      map((res) => this.mapearUsuario(res.user)),
      catchError((err) => this.manejarError(err)),
    );
  }

  login(email: string, password: string): Observable<Usuario> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/signin`, { email, password }).pipe(
      tap((res) => this.iniciarSesion(res.user, res.token)),
      map((res) => this.mapearUsuario(res.user)),
      catchError((err) => this.manejarError(err)),
    );
  }

  logout(): void {
    this.usuario.set(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.sesion);
      localStorage.removeItem(STORAGE_KEYS.token);
    } catch {}
  }

  actualizarPerfil(
    cambios: Pick<Usuario, 'nombre' | 'apellido' | 'direccion'>,
  ): Observable<Usuario> {
    return this.http.put<UsuarioApi>(`${API_URL}/auth/me`, cambios).pipe(
      map((u) => this.mapearUsuario(u)),
      tap((usuario) => this.guardarSesion(usuario)),
      catchError((err) => this.manejarError(err)),
    );
  }

  // ─── helpers privados ───────────────────────────────────────

  private iniciarSesion(user: UsuarioApi, token: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.token, token);
    } catch {}
    this.guardarSesion(this.mapearUsuario(user));
  }

  private guardarSesion(usuario: Usuario): void {
    this.usuario.set(usuario);
    try {
      localStorage.setItem(STORAGE_KEYS.sesion, JSON.stringify(usuario));
    } catch {}
  }

  /** El backend usa rol en MAYÚSCULAS; el frontend, en minúsculas. */
  private mapearUsuario(u: UsuarioApi): Usuario {
    return {
      id: u.id,
      nombre: u.nombre,
      apellido: u.apellido,
      email: u.email,
      direccion: u.direccion,
      rol: u.rol === 'ADMIN' ? 'admin' : 'cliente',
    };
  }

  private cargarSesion(): Usuario | null {
    try {
      const u = JSON.parse(localStorage.getItem(STORAGE_KEYS.sesion) ?? 'null');
      return u && u.email && localStorage.getItem(STORAGE_KEYS.token) ? (u as Usuario) : null;
    } catch {
      return null;
    }
  }

  private manejarError(err: HttpErrorResponse) {
    if (err.status === 0) {
      return throwError(() => new Error('No se pudo conectar con el servidor.'));
    }
    const mensaje = err.error?.message ?? err.error?.error ?? 'Ocurrió un error. Probá de nuevo.';
    return throwError(() => new Error(mensaje));
  }
}