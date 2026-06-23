import { Router } from 'express';
import {
  createCircular,
  getCirculars,
  getCommunicationLogs,
  getCommunicationSettings,
  publishCircular,
  receiveWhatsAppWebhook,
  registerPushDevice,
  sendManualMessage,
  updateCommunicationSettings,
  verifyWhatsAppWebhook,
} from '../controllers/communicationController';
import { protect, restrictTo, Role } from '../middlewares/authMiddleware';

const router = Router();

router.get('/whatsapp/webhook', verifyWhatsAppWebhook as any);
router.post('/whatsapp/webhook', receiveWhatsAppWebhook as any);

router.use(protect as any);

router.get('/settings', restrictTo(Role.ADMIN, Role.STAFF), getCommunicationSettings as any);
router.patch('/settings', restrictTo(Role.ADMIN, Role.STAFF), updateCommunicationSettings as any);
router.get('/circulars', getCirculars as any);
router.post('/circulars', restrictTo(Role.ADMIN, Role.HOD, Role.STAFF), createCircular as any);
router.patch('/circulars/:circularId/publish', restrictTo(Role.ADMIN, Role.HOD, Role.STAFF), publishCircular as any);
router.post('/messages', restrictTo(Role.ADMIN, Role.HOD, Role.STAFF), sendManualMessage as any);
router.get('/logs', restrictTo(Role.ADMIN, Role.HOD, Role.STAFF), getCommunicationLogs as any);
router.post('/push-devices', registerPushDevice as any);

export default router;
