import { Router } from 'express';
import { getMISDashboard } from '../controllers/misController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();
router.use(protect as any);

router.get('/overview', getMISDashboard as any);

export default router;
