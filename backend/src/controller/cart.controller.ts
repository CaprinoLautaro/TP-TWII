import type { Request, Response } from 'express';
import type { CartService } from '../services/cart.service';

export class CartController {
  constructor(private readonly service: CartService) {}

  getCart = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    res.json(await this.service.getCart(userId));
  };

  addItem = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    res.status(201).json(await this.service.addItem(userId, req.body));
  };

  updateItem = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    res.json(
      await this.service.updateItem(userId, Number(req.params.productId), req.body),
    );
  };

  removeItem = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    res.json(await this.service.removeItem(userId, Number(req.params.productId)));
  };
}