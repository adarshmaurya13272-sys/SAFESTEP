import { Router } from 'express';
import { getNearbyHelp } from './help.controller';
import { authenticate } from '../../middleware/auth';

const router: Router = Router();

router.use(authenticate);
router.get('/nearby', getNearbyHelp);

export default router;
