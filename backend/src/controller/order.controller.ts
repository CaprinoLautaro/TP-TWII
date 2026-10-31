import type { Request, Response } from 'express';
import type { OrderService } from '../services/order.service';

export class OrderController {
  constructor(private readonly service: OrderService) {}

  // TODO: en todos, userId = id del usuario autenticado

confirm = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || 1;
      const resultado = await this.service.confirm(userId, req.body);
      return res.status(201).json(resultado);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Error al procesar la orden' });
    }
  };

  list = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || 0;
      const pedidos = await this.service.list(userId);
      return res.json(pedidos);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || 0;
      const pedido = await this.service.getById(userId, Number(req.params.id));
      if (!pedido) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }
      return res.json(pedido);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  };
}
