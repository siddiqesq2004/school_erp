import { Router } from 'express';
import {
  createExam,
  createExamSubject,
  getExams,
  getMarksEntry,
  getResultAnalysis,
  saveMarks,
} from '../controllers/examController';
import { protect, restrictTo, Role } from '../middlewares/authMiddleware';

const router = Router();

router.use(protect as any);

router.get('/', getExams as any);
router.post('/', restrictTo(Role.ADMIN, Role.HOD, Role.TEACHER), createExam as any);
router.post('/subjects', restrictTo(Role.ADMIN, Role.HOD, Role.TEACHER), createExamSubject as any);
router.get('/subjects/:examSubjectId/marks', getMarksEntry as any);
router.post('/marks', restrictTo(Role.ADMIN, Role.HOD, Role.TEACHER), saveMarks as any);
router.get('/analysis', getResultAnalysis as any);

export default router;
