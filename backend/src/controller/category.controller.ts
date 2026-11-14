import type { Request, Response } from 'express';
import type { CategoryService } from '../services/category.service';

/** CONTROLADOR de categorías. */
export class CategoryController {
  constructor(private readonly service: CategoryService) {}

  getAll = async (_req: Request, res: Response) => {
    res.json(await this.service.getAll());
  };

  create = async (req: Request, res: Response) => {
    res.status(201).json(await this.service.create(req.body));
  };
}
