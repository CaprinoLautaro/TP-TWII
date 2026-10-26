import type { Request, Response } from 'express';
import type { AuthService } from '../services/auth.service';

export class AuthController {
  constructor(private readonly service: AuthService) {}

  signup = async (req: Request, res: Response) => {
    res.status(201).json(await this.service.signup(req.body));
  };

  signin = async (req: Request, res: Response) => {
    res.json(await this.service.signin(req.body));
  };

  me = async (_req: Request, res: Response) => {
    const userId = 0; // TODO: id del usuario autenticado (lo carga el middleware authenticate)
    res.json(await this.service.getProfile(userId));
  };

  updateMe = async (req: Request, res: Response) => {
    const userId = 0; // TODO: id del usuario autenticado
    res.json(await this.service.updateProfile(userId, req.body));
  };
}
