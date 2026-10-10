import { Request, Response, NextFunction } from 'express';
import { SosService } from './sos.service';

const sosService = new SosService();

export const triggerSos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await sosService.triggerSos(req.user!.userId, req.body);
    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
};

export const resolveSos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await sosService.resolveSos(req.user!.userId, req.params.id!);
    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
};

export const getSosHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await sosService.getSosHistory(req.user!.userId);
    res.status(200).json({ data: history });
  } catch (error) {
    next(error);
  }
};
