import { Router } from 'express';
import {
  createLeave,
  createSalaryStructure,
  exportBankTransfer,
  getLeaves,
  getPayrollRuns,
  getSalaryStructures,
  markPayrollPaid,
  processPayroll,
  updateLeaveStatus,
  updateStaffDetails,
} from '../controllers/payrollController';
import { protect, restrictTo, Role } from '../middlewares/authMiddleware';

const router = Router();

router.use(protect as any);

router.patch('/staff/:staffId', restrictTo(Role.ADMIN, Role.STAFF), updateStaffDetails as any);
router.get('/salaries', restrictTo(Role.ADMIN, Role.STAFF), getSalaryStructures as any);
router.post('/salaries', restrictTo(Role.ADMIN, Role.STAFF), createSalaryStructure as any);
router.get('/leaves', getLeaves as any);
router.post('/leaves', restrictTo(Role.ADMIN, Role.HOD, Role.TEACHER, Role.STAFF), createLeave as any);
router.patch('/leaves/:leaveId', restrictTo(Role.ADMIN, Role.HOD, Role.STAFF), updateLeaveStatus as any);
router.get('/runs', restrictTo(Role.ADMIN, Role.STAFF), getPayrollRuns as any);
router.post('/runs', restrictTo(Role.ADMIN, Role.STAFF), processPayroll as any);
router.patch('/runs/:runId/paid', restrictTo(Role.ADMIN, Role.STAFF), markPayrollPaid as any);
router.get('/runs/:runId/bank-transfer', restrictTo(Role.ADMIN, Role.STAFF), exportBankTransfer as any);

export default router;
