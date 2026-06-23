import { Router } from 'express';
import {
  createClass,
  getClasses,
  createSection,
  registerStudent,
  getStudents,
  registerStaff,
  getStaff,
} from '../controllers/schoolController';
import { protect, restrictTo, Role } from '../middlewares/authMiddleware';

const router = Router();

// Protect all routes in this router
router.use(protect as any);

// Classes & Sections
router.post('/classes', restrictTo(Role.ADMIN), createClass as any);
router.get('/classes', getClasses as any);
router.post('/sections', restrictTo(Role.ADMIN), createSection as any);

// Students
router.post('/students', restrictTo(Role.ADMIN, Role.STAFF), registerStudent as any);
router.get('/students', getStudents as any);

// Staff
router.post('/staff', restrictTo(Role.ADMIN), registerStaff as any);
router.get('/staff', getStaff as any);

export default router;
