import { Router } from 'express';
import { registerSchool, login, getMe, getSchoolByCode, createPortalUser, getPortalUsers, deletePortalUser } from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

router.post('/register-school', registerSchool);
router.post('/login', login);
router.get('/me', protect as any, getMe as any);
router.get('/school/:code', getSchoolByCode);
router.post('/create-portal-user', protect as any, createPortalUser as any);
router.get('/portal-users', protect as any, getPortalUsers as any);
router.delete('/portal-user/:id', protect as any, deletePortalUser as any);

export default router;
