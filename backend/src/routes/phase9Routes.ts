import { Router } from 'express';
import {
  createUDISE,
  listUDISE,
  createBoard,
  listBoards,
  submitReport,
  listReports,
  createAdmission,
  listAdmissions,
  updateAdmissionStatus,
  phase9Summary,
} from '../controllers/phase9Controller';
import { protect, restrictTo, Role } from '../middlewares/authMiddleware';

const router = Router();

router.use(protect as any);

// UDISE
router.post('/udise', restrictTo(Role.ADMIN, Role.STAFF), createUDISE as any);
router.get('/udise', listUDISE as any);

// Board
router.post('/boards', restrictTo(Role.ADMIN, Role.STAFF), createBoard as any);
router.get('/boards', listBoards as any);

// Government reports
router.post('/reports', restrictTo(Role.ADMIN, Role.STAFF), submitReport as any);
router.get('/reports', listReports as any);

// Admissions
router.post('/admissions', restrictTo(Role.ADMIN, Role.STAFF), createAdmission as any);
router.get('/admissions', listAdmissions as any);
router.patch('/admissions/:id/status', restrictTo(Role.ADMIN, Role.STAFF), updateAdmissionStatus as any);

// Summary
router.get('/summary', phase9Summary as any);

export default router;
