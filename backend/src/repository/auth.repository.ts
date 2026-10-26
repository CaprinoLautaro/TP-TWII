import type { PrismaClient, User } from '../../generated/prisma/client';
import type { CreateUserData, UpdateProfileDto } from '../types/auth.types';

export class AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: CreateUserData): Promise<User> {
    const { passwordHash, ...resto } = data;
    return this.prisma.user.create({ data: { ...resto, password: passwordHash } });
  }

  updateProfile(id: number, data: UpdateProfileDto): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }
}
