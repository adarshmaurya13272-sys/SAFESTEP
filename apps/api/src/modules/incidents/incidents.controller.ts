import { Request, Response, NextFunction } from 'express';
import { IncidentsService } from './incidents.service';

const incidentsService = new IncidentsService();

export const createIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const incident = await incidentsService.createIncident(req.user!.userId, req.body);
    res.status(201).json({ data: incident });
  } catch (error) {
    next(error);
  }
};

export const getIncidents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const incidents = await incidentsService.getIncidents(req.query);
    res.status(200).json({ data: incidents });
  } catch (error) {
    next(error);
  }
};

export const flagIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await incidentsService.flagIncident(req.params.id!);
    res.status(200).json({ data: { success: true } });
  } catch (error) {
    next(error);
  }
};
