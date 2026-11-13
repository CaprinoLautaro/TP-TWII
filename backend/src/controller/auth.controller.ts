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

  requestPasswordReset = async (req: Request, res: Response) => {
    await this.service.requestPasswordReset(req.body.email);

    res.json({
      message: 'Si el correo está registrado, recibirás un enlace de recuperación.'
    });
  };

  resetPassword = async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    await this.service.resetPassword(token, newPassword);

    res.json({
      message: 'Tu contraseña se actualizó correctamente.'
    });
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
