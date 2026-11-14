import { compare, hash } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { config } from '../config/config';
import { AppError } from '../utils/app-error';
import type { User } from '../../generated/prisma/client';
import type { AuthRepository } from '../repository/auth.repository';
import type { SigninDto, SignupDto, UpdateProfileDto } from '../types/auth.types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export class AuthService {
  constructor(private readonly repository: AuthRepository) {}

  async signup(dto: SignupDto) {
    const nombre = dto.nombre?.trim();
    const apellido = dto.apellido?.trim();
    const direccion = dto.direccion?.trim();
    const email = dto.email?.trim().toLowerCase();

    if (!nombre || !apellido || !direccion || !email || !dto.password) {
      throw AppError.badRequest('Completá todos los campos obligatorios.');
    }
    if (!EMAIL_REGEX.test(email)) {
      throw AppError.badRequest('Ingresá un email válido.');
    }
    if (!PASSWORD_REGEX.test(dto.password)) {
      throw AppError.badRequest(
        'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.',
      );
    }
    if (await this.repository.findByEmail(email)) {
      throw AppError.conflict('Ya existe una cuenta con ese email.');
    }

    const passwordHash = await hash(dto.password, 10);
    const user = await this.repository.create({ email, nombre, apellido, direccion, passwordHash });

    return { user: this.toPublicUser(user), token: this.generateToken(user) };
  }

  async signin(dto: SigninDto) {
    const email = dto.email?.trim().toLowerCase();
    const mensaje = 'Email o contraseña incorrectos.';

    if (!email || !dto.password) throw AppError.unauthorized(mensaje);

    const user = await this.repository.findByEmail(email);
    if (!user || !(await compare(dto.password, user.password))) {
      throw AppError.unauthorized(mensaje);
    }

    return { user: this.toPublicUser(user), token: this.generateToken(user) };
  }

  async getProfile(userId: number) {
    const user = await this.repository.findById(userId);
    if (!user) throw AppError.notFound('El usuario no existe.');
    return this.toPublicUser(user);
  }

  /** Edita nombre, apellido y dirección. El email, el rol y la contraseña no se tocan acá. */
  async updateProfile(userId: number, body: unknown) {
    const datos = typeof body === 'object' && body !== null ? (body as Partial<UpdateProfileDto>) : {};
    const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
    const apellido = typeof datos.apellido === 'string' ? datos.apellido.trim() : '';
    const direccion = typeof datos.direccion === 'string' ? datos.direccion.trim() : '';

    if (!nombre || !apellido || !direccion) {
      throw AppError.badRequest('Nombre, apellido y dirección son obligatorios.');
    }
    if (nombre.length > 60 || apellido.length > 60 || direccion.length > 200) {
      throw AppError.badRequest('Alguno de los datos es demasiado largo.');
    }

    if (!(await this.repository.findById(userId))) {
      throw AppError.notFound('El usuario no existe.');
    }

    const actualizado = await this.repository.updateProfile(userId, { nombre, apellido, direccion });
    return this.toPublicUser(actualizado);
  }

  private toPublicUser(user: User) {
    const { password: _password, ...resto } = user;
    return resto;
  }

  private generateToken(user: User) {
    if (!config.jwtSecret) {
      throw new Error('Falta JWT_SECRET en el archivo .env del backend.');
    }
    return sign({ rol: user.rol }, config.jwtSecret, {
      subject: String(user.id),
      expiresIn: '7d',
    });
  }
}
