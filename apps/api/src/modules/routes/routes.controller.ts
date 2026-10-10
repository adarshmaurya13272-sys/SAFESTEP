import { Request, Response, NextFunction } from 'express';
import { RoutesService } from './routes.service';

const routesService = new RoutesService();

export const compareRoutes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const routes = await routesService.compareRoutes(req.body);
    res.status(200).json({ data: routes });
  } catch (error) {
    next(error);
  }
};

export const geocode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Missing query parameter q' } });
    }
    const results = await routesService.geocode(query);
    res.status(200).json({ data: results });
  } catch (error) {
    next(error);
  }
};
