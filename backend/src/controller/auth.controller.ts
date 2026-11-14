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

  // En estas dos rutas el middleware `authenticate` ya verificó el token y cargó req.user.
  me = async (req: Request, res: Response) => {
    res.json(await this.service.getProfile(req.user!.id));
  };

  updateMe = async (req: Request, res: Response) => {
    res.json(await this.service.updateProfile(req.user!.id, req.body));
  };
}
