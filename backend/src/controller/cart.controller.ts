import type { Request, Response } from 'express';
import { AppError } from '../utils/app-error';
import type { CartService } from '../services/cart.service';

export class CartController {
  constructor(private readonly service: CartService) {}

  getCart = async (req: Request, res: Response) => {
    res.json(await this.service.getCart(this.userId(req)));
  };

  addItem = async (req: Request, res: Response) => {
    res.status(201).json(await this.service.addItem(this.userId(req), req.body));
  };

  updateItem = async (req: Request, res: Response) => {
    res.json(await this.service.updateItem(this.userId(req), this.productId(req), req.body));
  };

  removeItem = async (req: Request, res: Response) => {
    res.json(await this.service.removeItem(this.userId(req), this.productId(req)));
  };

  // ─── helpers ────────────────────────────────────────────────

  private userId(req: Request): number {
    if (!req.user) {
      throw AppError.unauthorized('Usuario no autenticado.');
    }
    return req.user.id;
  }

  private productId(req: Request): number {
    const id = Number(req.params.productId);
    if (!Number.isInteger(id)) {
      throw AppError.badRequest('El productId debe ser un número.');
    }
    return id;
  }
}