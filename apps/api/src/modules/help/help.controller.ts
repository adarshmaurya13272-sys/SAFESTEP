import { Request, Response, NextFunction } from 'express';
import { HelpService } from './help.service';

const helpService = new HelpService();

export const getNearbyHelp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseFloat(req.query.radius as string) || 5000;
    const typesStr = req.query.types as string;
    
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'lat and lng are required' } });
    }

    const types = typesStr ? typesStr.split(',') : ['police', 'hospital', 'clinic', 'pharmacy'];

    const places = await helpService.getNearbyHelp(lat, lng, radius, types);
    res.status(200).json({ data: places });
  } catch (error) {
    next(error);
  }
};
