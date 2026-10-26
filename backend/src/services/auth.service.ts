import { AppError } from '../utils/app-error';
import type { AuthRepository } from '../repository/auth.repository';
import type { SigninDto, SignupDto, UpdateProfileDto } from '../types/auth.types';

export class AuthService {
  constructor(private readonly repository: AuthRepository) {}

  async signup(_dto: SignupDto) {
    // TODO: validar campos obligatorios y complejidad de la contraseña (min. 8, mayúscula, minúscula, número),
    //       rechazar email repetido con AppError.conflict(...) (409), hashear con bcrypt,
    //       crear el usuario y devolver el usuario (sin password) + token.
    throw AppError.notImplemented('signup');
  }

  async signin(_dto: SigninDto) {
    // TODO: buscar por email, comparar la contraseña con bcrypt, devolver usuario + token JWT.
    //       Si falla, mismo mensaje genérico para email o contraseña incorrectos (401).
    throw AppError.notImplemented('signin');
  }

  async getProfile(_userId: number) {
    // TODO: devolver el usuario sin el campo password.
    throw AppError.notImplemented('getProfile');
  }

  async updateProfile(_userId: number, _dto: UpdateProfileDto) {
    // TODO: validar nombre, apellido y dirección (no vacíos) y actualizar.
    throw AppError.notImplemented('updateProfile');
  }
}
