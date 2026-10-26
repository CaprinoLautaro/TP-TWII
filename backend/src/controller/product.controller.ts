import type { Request, Response } from 'express';
import { AppError } from '../utils/app-error';
import type { ProductService } from '../services/product.service';

/** CONTROLADOR: traduce HTTP (req/res) a llamadas al servicio. No tiene reglas de negocio. */
export class ProductController {
  constructor(private readonly service: ProductService) {}

  getAll = async (req: Request, res: Response) => {
    const clasificacion =
      typeof req.query.clasificacion === 'string' ? req.query.clasificacion : undefined;
    res.json(await this.service.getAll({ clasificacion }));
  };

  getById = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw AppError.badRequest('El id debe ser un número.');
    res.json(await this.service.getById(id));
  };
}
