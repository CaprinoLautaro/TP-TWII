import { Injectable, computed, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { Usuario } from '../../models/user/user';

const USUARIOS_KEY = 'patitas_usuarios';
const SESION_KEY = 'patitas_sesion';

// Admin hardcodeado: no se puede registrar ni editar desde la app.
const ADMIN: Usuario = {
  id: 0,
  nombre: 'Admin',
  apellido: 'Patitas',
  email: 'admin@patitas.com',
  direccion: 'Sucursal Central',
  password: 'Admin123',
  rol: 'admin',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _usuario = signal<Usuario | null>(this.cargarSesion());

  readonly usuarioActual = this._usuario.asReadonly();
  readonly estaLogueado = computed(() => this._usuario() !== null);
  readonly esAdmin = computed(() => this._usuario()?.rol === 'admin');

  /** POST /auth/signup */
  registrar(datos: Omit<Usuario, 'id' | 'rol'>): Observable<Usuario> {
    const email = datos.email.trim().toLowerCase();
    const usuarios = this.cargarUsuarios();

    if (email === ADMIN.email || usuarios.some((u) => u.email === email)) {
      return throwError(() => new Error('Ya existe una cuenta con ese email.'));
    }

    const nuevo: Usuario = {
      id: Math.max(0, ...usuarios.map((u) => Number(u.id))) + 1,
      nombre: datos.nombre.trim(),
      apellido: datos.apellido.trim(),
      email,
      direccion: datos.direccion.trim(),
      password: datos.password,
      rol: 'cliente',
    };
    this.guardarUsuarios([...usuarios, nuevo]);
    this.iniciarSesion(nuevo);
    return of(this.sinPassword(nuevo));
  }

  /** POST /auth/signin */
  login(email: string, password: string): Observable<Usuario> {
    const emailNorm = email.trim().toLowerCase();
    const usuario = [ADMIN, ...this.cargarUsuarios()].find(
      (u) => u.email === emailNorm && u.password === password,
    );
    if (!usuario) {
      return throwError(() => new Error('Email o contraseña incorrectos.'));
    }
    this.iniciarSesion(usuario);
    return of(this.sinPassword(usuario));
  }

  logout(): void {
    this._usuario.set(null);
    try {
      localStorage.removeItem(SESION_KEY);
    } catch {}
  }

  /** PUT /usuarios/me */
  actualizarPerfil(
    cambios: Pick<Usuario, 'nombre' | 'apellido' | 'direccion'>,
  ): Observable<Usuario> {
    const actual = this._usuario();
    if (!actual) {
      return throwError(() => new Error('Tenés que iniciar sesión.'));
    }
    if (actual.rol === 'admin') {
      return throwError(() => new Error('El perfil del administrador no se puede modificar.'));
    }

    const usuarios = this.cargarUsuarios();
    const i = usuarios.findIndex((u) => u.email === actual.email);
    if (i === -1) {
      return throwError(() => new Error('No se encontró el usuario.'));
    }

    const actualizado: Usuario = {
      ...usuarios[i],
      nombre: cambios.nombre.trim(),
      apellido: cambios.apellido.trim(),
      direccion: cambios.direccion.trim(),
    };
    usuarios[i] = actualizado;
    this.guardarUsuarios(usuarios);
    this.iniciarSesion(actualizado);
    return of(this.sinPassword(actualizado));
  }

  // ---------- internos ----------
  private iniciarSesion(usuario: Usuario): void {
    const sesion = this.sinPassword(usuario);
    this._usuario.set(sesion);
    try {
      localStorage.setItem(SESION_KEY, JSON.stringify(sesion));
    } catch {}
  }

  private sinPassword(u: Usuario): Usuario {
    return { ...u, password: undefined };
  }

  private cargarSesion(): Usuario | null {
    try {
      const u = JSON.parse(localStorage.getItem(SESION_KEY) ?? 'null');
      return u && u.email ? (u as Usuario) : null;
    } catch {
      return null;
    }
  }

  private cargarUsuarios(): Usuario[] {
    try {
      const lista = JSON.parse(localStorage.getItem(USUARIOS_KEY) ?? '[]');
      return Array.isArray(lista) ? lista : [];
    } catch {
      return [];
    }
  }

  private guardarUsuarios(lista: Usuario[]): void {
    try {
      localStorage.setItem(USUARIOS_KEY, JSON.stringify(lista));
    } catch {}
  }
}
