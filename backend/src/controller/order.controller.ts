import type { Request, Response } from 'express';
import type { OrderService } from '../services/order.service';

export class OrderController {
  constructor(private readonly service: OrderService) {}

  // TODO: en todos, userId = id del usuario autenticado

  confirm = async (_req: Request, res: Response) => {
    const userId = 0;
    res.status(201).json(await this.service.confirm(userId));
  };

  list = async (_req: Request, res: Response) => {
    const userId = 0;
    res.json(await this.service.list(userId));
  };

  getById = async (req: Request, res: Response) => {
    const userId = 0;
    res.json(await this.service.getById(userId, Number(req.params.id)));
  };
}
