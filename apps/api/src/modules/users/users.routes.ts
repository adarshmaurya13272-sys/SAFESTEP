import { Router } from 'express';
import { getProfile, updateProfile, deleteAccount } from './users.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { z } from 'zod';

const router: Router = Router();

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  emergencyNote: z.string().optional(),
});

router.use(authenticate);
router.get('/', getProfile);
router.patch('/', validate(updateProfileSchema), updateProfile);
router.delete('/', deleteAccount);

export default router;
