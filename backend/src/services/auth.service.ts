import { compare, hash } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { config } from '../config/config';
import { AppError } from '../utils/app-error';
import type { User } from '../../generated/prisma/client';
import type { AuthRepository } from '../repository/auth.repository';
import type { SigninDto, SignupDto, UpdateProfileDto } from '../types/auth.types';
import { randomBytes, createHash } from 'node:crypto';
import { MailService } from './mail.service';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export class AuthService {
  constructor(private readonly repository: AuthRepository) {}
  private readonly mailService = new MailService();

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

  private generateResetToken() {
    const token = randomBytes(32).toString('hex');

    const tokenHash = createHash('sha256')
      .update(token)
      .digest('hex');

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    return { token, tokenHash, expiresAt };
  }


  async requestPasswordReset(email: string) {
    const emailNormalizado = email?.trim().toLowerCase();

    if (!emailNormalizado || !EMAIL_REGEX.test(emailNormalizado)) {
      throw AppError.badRequest('Ingresá un email válido.');
    }

    const user = await this.repository.findByEmail(emailNormalizado);

    if (!user) {
      return;
    }

    const { token, tokenHash, expiresAt } = this.generateResetToken();

    await this.repository.saveResetToken(
      user.id,
      tokenHash,
      expiresAt
    );

    await this.mailService.sendPasswordResetEmail(
      user.email,
      token
    );
  }


  async resetPassword(token: string, newPassword: string) {

    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
      throw AppError.badRequest('El enlace de recuperación no es válido.');
    }

    if (!newPassword || !PASSWORD_REGEX.test(newPassword)) {
      throw AppError.badRequest(
        'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.'
      );
    }

    const tokenHash = createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await this.repository.findByResetTokenHash(tokenHash);

    if (!user || !user.resetTokenExpiresAt ||
      user.resetTokenExpiresAt <= new Date()) {
      throw AppError.badRequest(
        'El enlace de recuperación es inválido o ha vencido.'
      );
    }

    const passwordHash = await hash(newPassword, 10);

    const updated = await this.repository.updatePasswordWithResetToken(
      user.id,
      tokenHash,
      passwordHash
    );

    if (!updated) {
      throw AppError.badRequest(
        'El enlace de recuperación es inválido o ha vencido.'
      );
    }
  }


  async getProfile(_userId: number) {
    // TODO: devolver el usuario sin el campo password.
    throw AppError.notImplemented('getProfile');
  }

  async updateProfile(_userId: number, _dto: UpdateProfileDto) {
    // TODO: validar nombre, apellido y dirección (no vacíos) y actualizar.
    throw AppError.notImplemented('updateProfile');
  }


  private toPublicUser(user: User) {
    const {
      password: _password,
      resetTokenHash: _resetTokenHash,
      resetTokenExpiresAt: _resetTokenExpiresAt,
      ...resto
    } = user;

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
