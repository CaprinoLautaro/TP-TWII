import type { Request, Response, NextFunction } from 'express';
import type { OrderService } from '../services/order.service';

export class OrderController {
  constructor(private readonly service: OrderService) {}

  // POST /api/orders Confirma y crea un nuevo pedido para el usuario logeado
  confirm = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const resultado = await this.service.confirm(userId, req.body);
      return res.status(201).json(resultado);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/orders Devuelve el historial de pedidos del usuario logeado
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const pedidos = await this.service.list(userId);
      return res.json(pedidos);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/orders/:id Devuelve el detalle de un pedido especifico del usuario logeado
  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const orderId = Number(req.params.id);
      
      // Valida que el parametro de la URL sea un id numerico valido
      if (!Number.isInteger(orderId) || orderId <= 0) {
        return res.status(400).json({ error: 'ID de pedido inválido' });
      }

      // Si el pedido no existe, lanza un AppError que captura el catch
      const pedido = await this.service.getById(userId, orderId);
      return res.json(pedido);
    } catch (error) {
      next(error);
    }
  };
}