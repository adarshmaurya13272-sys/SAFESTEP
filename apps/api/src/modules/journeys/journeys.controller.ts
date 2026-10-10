import { Request, Response, NextFunction } from 'express';
import { JourneysService } from './journeys.service';

const journeysService = new JourneysService();

export const createJourney = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const journey = await journeysService.createJourney(req.user!.userId, req.body);
    res.status(201).json({ data: journey });
  } catch (error) {
    next(error);
  }
};

export const getJourneys = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const journeys = await journeysService.getJourneys(req.user!.userId);
    res.status(200).json({ data: journeys });
  } catch (error) {
    next(error);
  }
};

export const getJourney = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const journey = await journeysService.getJourney(req.user!.userId, req.params.id!);
    res.status(200).json({ data: journey });
  } catch (error) {
    next(error);
  }
};

export const endJourney = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const journey = await journeysService.endJourney(req.user!.userId, req.params.id!);
    res.status(200).json({ data: journey });
  } catch (error) {
    next(error);
  }
};

export const addPing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ping = await journeysService.addPing(req.user!.userId, req.params.id!, req.body);
    res.status(201).json({ data: ping });
  } catch (error) {
    next(error);
  }
};

export const getTrackingData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await journeysService.getTrackingData(req.params.token!);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};
