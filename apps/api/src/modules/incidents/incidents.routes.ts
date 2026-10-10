import { Router } from 'express';
import { createIncident, getIncidents, flagIncident } from './incidents.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { z } from 'zod';

const router: Router = Router();

const createIncidentSchema = z.object({
  category: z.enum(['HARASSMENT', 'SUSPICIOUS_ACTIVITY', 'POOR_LIGHTING', 'OTHER']),
  description: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
});

router.use(authenticate);
router.post('/', validate(createIncidentSchema), createIncident);
router.get('/', getIncidents);
router.post('/:id/flag', flagIncident);

export default router;
