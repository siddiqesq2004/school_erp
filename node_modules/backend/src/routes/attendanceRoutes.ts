import { Router } from 'express';
import {
  getAttendanceReport,
  getStaffAttendance,
  getStudentAttendance,
  markStaffAttendance,
  markStudentAttendance,
} from '../controllers/attendanceController';
import { protect, restrictTo, Role } from '../middlewares/authMiddleware';

const router = Router();

router.use(protect as any);

router.get('/students', getStudentAttendance as any);
router.post('/students', restrictTo(Role.ADMIN, Role.HOD, Role.TEACHER, Role.STAFF), markStudentAttendance as any);
router.get('/reports/monthly', getAttendanceReport as any);

router.get('/staff', restrictTo(Role.ADMIN, Role.HOD, Role.STAFF), getStaffAttendance as any);
router.post('/staff', restrictTo(Role.ADMIN, Role.HOD, Role.STAFF), markStaffAttendance as any);

export default router;
