import { compare, hash } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { config } from '../config/config';
import { AppError } from '../utils/app-error';
import type { User } from '../../generated/prisma/client';
import type { AuthRepository } from '../repository/auth.repository';
import type {
  AuthResponseDto,
  PublicUser,
  SigninDto,
  SignupDto,
  UpdateProfileDto,
} from '../types/auth.types';
import { randomBytes, createHash } from 'node:crypto';
import { MailService } from './mail.service';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export class AuthService {
  constructor(private readonly repository: AuthRepository) {}
  private readonly mailService = new MailService();

  async signup(dto: SignupDto): Promise<AuthResponseDto> {
    const data = this.normalizarSignup(dto);
    this.validarSignup(data);

    if (await this.repository.findByEmail(data.email)) {
      throw AppError.conflict('Ya existe una cuenta con ese email.');
    }

    const passwordHash = await hash(data.password, 10);
    const user = await this.repository.create({ ...data, passwordHash });

    return this.toAuthResponse(user);
  }

  async signin(dto: SigninDto): Promise<AuthResponseDto> {
    const email = dto.email?.trim().toLowerCase();
    const credencialesInvalidas = 'Email o contraseña incorrectos.';

    if (!email || !dto.password) {
      throw AppError.unauthorized(credencialesInvalidas);
    }

    const user = await this.repository.findByEmail(email);
    if (!user || !(await compare(dto.password, user.password))) {
      throw AppError.unauthorized(credencialesInvalidas);
    }

    return this.toAuthResponse(user);
  }

  async getProfile(userId: number): Promise<PublicUser> {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw AppError.notFound('Usuario no encontrado.');
    }
    return this.toPublicUser(user);
  }

  // ─── helpers privados ───────────────────────────────────────

  private normalizarSignup(dto: SignupDto) {
    return {
      email: dto.email?.trim().toLowerCase() ?? '',
      password: dto.password ?? '',
      nombre: dto.nombre?.trim() ?? '',
      apellido: dto.apellido?.trim() ?? '',
      direccion: dto.direccion?.trim() ?? '',
    };
  }

  private validarSignup(data: ReturnType<AuthService['normalizarSignup']>) {
    if (!data.nombre || !data.apellido || !data.direccion || !data.email || !data.password) {
      throw AppError.badRequest('Completá todos los campos obligatorios.');
    }
    if (!EMAIL_REGEX.test(data.email)) {
      throw AppError.badRequest('Ingresá un email válido.');
    }
    if (!PASSWORD_REGEX.test(data.password)) {
      throw AppError.badRequest(
        'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.',
      );
    }
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


  private toPublicUser(user: User): PublicUser {
    const {
      password: _password,
      resetTokenHash: _resetTokenHash,
      resetTokenExpiresAt: _resetTokenExpiresAt,
      ...publicUser
    } = user;

    return publicUser;
  }
  private toAuthResponse(user: User): AuthResponseDto {
    return {
      user: this.toPublicUser(user),
      token: this.generateToken(user)
    };
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