import type { Request, Response } from 'express';
import type { CartService } from '../services/cart.service';

export class CartController {
  constructor(private readonly service: CartService) {}

  // TODO: en todos, userId = id del usuario autenticado (lo carga el middleware authenticate)

  getCart = async (_req: Request, res: Response) => {
    const userId = 0;
    res.json(await this.service.getCart(userId));
  };

  addItem = async (req: Request, res: Response) => {
    const userId = 0;
    res.status(201).json(await this.service.addItem(userId, req.body));
  };

  updateItem = async (req: Request, res: Response) => {
    const userId = 0;
    res.json(await this.service.updateItem(userId, Number(req.params.productId), req.body));
  };

  removeItem = async (req: Request, res: Response) => {
    const userId = 0;
    res.json(await this.service.removeItem(userId, Number(req.params.productId)));
  };
}
