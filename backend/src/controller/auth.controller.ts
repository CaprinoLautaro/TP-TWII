import type { Request, Response } from 'express';
import { AppError } from '../utils/app-error';
import type { AuthService } from '../services/auth.service';

export class AuthController {
  constructor(private readonly service: AuthService) {}

  signup = async (req: Request, res: Response) => {
    res.status(201).json(await this.service.signup(req.body));
  };

  signin = async (req: Request, res: Response) => {
    res.json(await this.service.signin(req.body));
  };

  me = async (req: Request, res: Response) => {
    res.json(await this.service.getProfile(this.userId(req)));
  };

  updateMe = async (req: Request, res: Response) => {
    res.json(await this.service.updateProfile(this.userId(req), req.body));
  };

  // ─── helper ─────────────────────────────────────────────────

  private userId(req: Request): number {
    if (!req.user) {
      throw AppError.unauthorized('Usuario no autenticado.');
    }
    return req.user.id;
  }
}