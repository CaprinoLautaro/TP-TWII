import type { User } from '../../generated/prisma/client';

/** El usuario sin el campo password (lo único que se devuelve al cliente). */
export type PublicUser = Omit<
  User,
  'password' | 'resetTokenHash' | 'resetTokenExpiresAt'
>;

/** POST /api/auth/signup */
export interface SignupDto {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  direccion: string;
}

/** POST /api/auth/signin */
export interface SigninDto {
  email: string;
  password: string;
}

/** PUT /api/auth/me */
export interface UpdateProfileDto {
  nombre: string;
  apellido: string;
  direccion: string;
}

/** Lo que se guarda en la base: la contraseña ya va hasheada. */
export interface CreateUserData extends Omit<SignupDto, 'password'> {
  passwordHash: string;
}

/** Respuesta de signup/signin: usuario público + token. */
export interface AuthResponseDto {
  user: PublicUser;
  token: string;
}