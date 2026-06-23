import { Router } from 'express';
import { protect, restrictTo, Role } from '../middlewares/authMiddleware';
import * as ctrl from '../controllers/phase12Controller';

const router = Router();

router.use(protect);

// Support tickets
router.get('/tickets', ctrl.listTickets);
router.post('/tickets', ctrl.createTicket);
router.get('/tickets/:id', ctrl.getTicket);
router.post('/tickets/:id/messages', ctrl.addTicketMessage);
router.put('/tickets/:id/status', restrictTo(Role.ADMIN, Role.HOD), ctrl.updateTicketStatus);

// Knowledge base
router.get('/kb', ctrl.listKBArticles);
router.post('/kb', restrictTo(Role.ADMIN, Role.HOD), ctrl.createKBArticle);
router.post('/kb/:id/view', ctrl.viewKBArticle);

// Video tutorials
router.get('/videos', ctrl.listVideos);
router.post('/videos', restrictTo(Role.ADMIN, Role.HOD), ctrl.createVideo);
router.post('/videos/:id/view', ctrl.viewVideo);

// System health & metrics
router.get('/health', ctrl.systemHealth);

export default router;
