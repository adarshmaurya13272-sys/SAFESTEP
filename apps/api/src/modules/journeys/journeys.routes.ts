import { Router } from 'express';
import { createJourney, getJourneys, getJourney, endJourney, addPing, getTrackingData } from './journeys.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { z } from 'zod';

const router: Router = Router();

const createJourneySchema = z.object({
  originLat: z.number(),
  originLng: z.number(),
  destLat: z.number(),
  destLng: z.number(),
  routeGeometry: z.array(z.array(z.number())),
  distance: z.number(),
  duration: z.number(),
  contactIds: z.array(z.string()).optional(),
});

const pingSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  accuracy: z.number().optional(),
});

router.get('/track/:token', getTrackingData);

router.use(authenticate);
router.post('/', validate(createJourneySchema), createJourney);
router.get('/', getJourneys);
router.get('/:id', getJourney);
router.post('/:id/end', endJourney);
router.post('/:id/ping', validate(pingSchema), addPing);

export default router;
