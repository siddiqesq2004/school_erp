import { Router } from 'express';
import {
  createHomework,
  createLessonPlan,
  createParentAccess,
  createTimetableSlot,
  deleteTimetableSlot,
  deleteTimetableSlots,
  generateTimetable,
  getHomework,
  getLessonPlans,
  getPortalSummary,
  getTimetable,
  updateTimetableSlot,
  updateHomeworkSubmission,
  updateLessonPlanStatus,
} from '../controllers/academicOpsController';
import { protect, restrictTo, Role } from '../middlewares/authMiddleware';

const router = Router();

router.use(protect as any);

router.get('/timetable', getTimetable as any);
router.post('/timetable', restrictTo(Role.ADMIN, Role.HOD, Role.TEACHER, Role.STAFF), createTimetableSlot as any);
router.patch('/timetable/:slotId', restrictTo(Role.ADMIN, Role.HOD, Role.TEACHER, Role.STAFF), updateTimetableSlot as any);
router.delete('/timetable', restrictTo(Role.ADMIN, Role.HOD, Role.STAFF), deleteTimetableSlots as any);
router.delete('/timetable/:slotId', restrictTo(Role.ADMIN, Role.HOD, Role.STAFF), deleteTimetableSlot as any);
router.post('/timetable/generate', restrictTo(Role.ADMIN, Role.HOD, Role.STAFF), generateTimetable as any);
router.get('/lesson-plans', getLessonPlans as any);
router.post('/lesson-plans', restrictTo(Role.ADMIN, Role.HOD, Role.TEACHER), createLessonPlan as any);
router.patch('/lesson-plans/:planId', restrictTo(Role.ADMIN, Role.HOD), updateLessonPlanStatus as any);
router.get('/homework', getHomework as any);
router.post('/homework', restrictTo(Role.ADMIN, Role.HOD, Role.TEACHER), createHomework as any);
router.patch('/homework/:homeworkId/submissions', updateHomeworkSubmission as any);
router.post('/parents', restrictTo(Role.ADMIN, Role.STAFF), createParentAccess as any);
router.get('/portal', getPortalSummary as any);

export default router;
