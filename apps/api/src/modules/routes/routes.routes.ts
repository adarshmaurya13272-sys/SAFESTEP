import { Router } from 'express';
import { compareRoutes, geocode } from './routes.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { z } from 'zod';

const router: Router = Router();

const compareRoutesSchema = z.object({
  originLat: z.number(),
  originLng: z.number(),
  destLat: z.number(),
  destLng: z.number(),
  departureTime: z.string().optional(),
});

router.use(authenticate);
router.post('/compare', validate(compareRoutesSchema), compareRoutes);
router.get('/geocode', geocode);

export default router;
