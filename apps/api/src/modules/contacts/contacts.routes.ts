import { Router } from 'express';
import { createContact, getContacts, deleteContact, acceptInvite, revokeContact } from './contacts.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { z } from 'zod';

const router: Router = Router();

const createContactSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional(),
}).refine(data => data.phone || data.email, {
  message: "Either phone or email must be provided"
});

router.post('/accept/:token', acceptInvite);

router.use(authenticate);
router.post('/', validate(createContactSchema), createContact);
router.get('/', getContacts);
router.delete('/:id', deleteContact);
router.post('/:id/revoke', revokeContact);

export default router;
