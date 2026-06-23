import { Router } from 'express';
import {
  assignFee,
  createFeeStructure,
  getFeePayments,
  getFeeStructures,
  getFeeSummary,
  recordPayment,
} from '../controllers/feeController';
import { protect, restrictTo, Role } from '../middlewares/authMiddleware';

const router = Router();

router.use(protect as any);

router.get('/structures', getFeeStructures as any);
router.post('/structures', restrictTo(Role.ADMIN, Role.STAFF), createFeeStructure as any);
router.post('/assign', restrictTo(Role.ADMIN, Role.STAFF), assignFee as any);
router.get('/payments', getFeePayments as any);
router.post('/payments', restrictTo(Role.ADMIN, Role.STAFF), recordPayment as any);
router.get('/summary', getFeeSummary as any);

export default router;
