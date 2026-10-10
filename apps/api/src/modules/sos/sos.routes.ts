import { Router } from 'express';
import { triggerSos, resolveSos, getSosHistory } from './sos.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { z } from 'zod';

const router: Router = Router();

const triggerSosSchema = z.object({
  journeyId: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
  accuracy: z.number().optional(),
});

router.use(authenticate);
router.post('/', validate(triggerSosSchema), triggerSos);
router.post('/:id/resolve', resolveSos);
router.get('/', getSosHistory);

export default router;
