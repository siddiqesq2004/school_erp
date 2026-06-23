import { Router } from 'express';
import {
  createAccountHead,
  getAccountHeads,
  recordLedgerEntry,
  getLedgerEntries,
  getAccountsSummary,
} from '../controllers/accountsController';
import { protect, restrictTo, Role } from '../middlewares/authMiddleware';

const router = Router();
router.use(protect as any);

router.get('/heads', getAccountHeads as any);
router.post('/heads', restrictTo(Role.ADMIN, Role.STAFF), createAccountHead as any);

router.get('/ledger', getLedgerEntries as any);
router.post('/ledger', restrictTo(Role.ADMIN, Role.STAFF), recordLedgerEntry as any);

router.get('/summary', getAccountsSummary as any);

export default router;
