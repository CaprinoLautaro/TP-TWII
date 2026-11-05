import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { Usuario } from '../../models/user/user';

const API_URL = 'http://localhost:3000/api/auth';
const TOKEN_KEY = 'patitas_token';
const SESION_KEY = 'patitas_sesion';

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
  private readonly _usuario = signal<Usuario | null>(this.cargarSesion());

  readonly usuarioActual = this._usuario.asReadonly();
  readonly estaLogueado = computed(() => this._usuario() !== null);
  readonly esAdmin = computed(() => this._usuario()?.rol === 'admin');

  get token(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  /** POST /api/auth/signup */
  registrar(datos: Omit<Usuario, 'id' | 'rol'>): Observable<Usuario> {
    return this.http.post<AuthResponse>(`${API_URL}/signup`, datos).pipe(
      tap((res) => this.iniciarSesion(res.user, res.token)),
      map((res) => this.aUsuario(res.user)),
      catchError((err) => this.manejarError(err)),
    );
  }

  /** POST /api/auth/signin */
  login(email: string, password: string): Observable<Usuario> {
    return this.http.post<AuthResponse>(`${API_URL}/signin`, { email, password }).pipe(
      tap((res) => this.iniciarSesion(res.user, res.token)),
      map((res) => this.aUsuario(res.user)),
      catchError((err) => this.manejarError(err)),
    );
  }

  logout(): void {
    this._usuario.set(null);
    try {
      localStorage.removeItem(SESION_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
  }

  /** PUT /api/auth/me */
  actualizarPerfil(
    cambios: Pick<Usuario, 'nombre' | 'apellido' | 'direccion'>,
  ): Observable<Usuario> {
    const actual = this._usuario();
    if (!actual) {
      return throwError(() => new Error('Tenés que iniciar sesión.'));
    }

    const headers = new HttpHeaders({ Authorization: `Bearer ${this.token ?? ''}` });
    return this.http.put<UsuarioApi>(`${API_URL}/me`, cambios, { headers }).pipe(
      map((u) => this.aUsuario(u)),
      tap((usuario) => this.guardarSesion(usuario)),
      catchError((err) => this.manejarError(err)),
    );
  }

  // ---------- internos ----------
  private iniciarSesion(user: UsuarioApi, token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {}
    this.guardarSesion(this.aUsuario(user));
  }

  private guardarSesion(usuario: Usuario): void {
    this._usuario.set(usuario);
    try {
      localStorage.setItem(SESION_KEY, JSON.stringify(usuario));
    } catch {}
  }

  // El backend devuelve el rol en mayúsculas (CLIENTE / ADMIN); el frontend usa minúsculas.
  private aUsuario(u: UsuarioApi): Usuario {
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
      const u = JSON.parse(localStorage.getItem(SESION_KEY) ?? 'null');
      return u && u.email && localStorage.getItem(TOKEN_KEY) ? (u as Usuario) : null;
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