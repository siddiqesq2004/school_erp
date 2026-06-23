import { Router } from 'express';
import { protect, restrictTo, Role } from '../middlewares/authMiddleware';
import * as c from '../controllers/phase10Controller';

const router = Router();

router.use(protect as any);

// LMS
router.post('/courses', restrictTo(Role.ADMIN, Role.STAFF), c.createCourse as any);
router.get('/courses', c.listCourses as any);
router.post('/lessons', restrictTo(Role.ADMIN, Role.STAFF), c.createVideoLesson as any);
router.get('/lessons', c.listVideoLessons as any);
router.post('/quizzes', restrictTo(Role.ADMIN, Role.STAFF), c.createQuiz as any);
router.post('/quiz-questions', restrictTo(Role.ADMIN, Role.STAFF), c.createQuizQuestion as any);
router.get('/quizzes', c.listQuizzes as any);

// Hostel
router.post('/hostels', restrictTo(Role.ADMIN, Role.STAFF), c.createHostel as any);
router.get('/hostels', c.listHostels as any);
router.post('/hostel-rooms', restrictTo(Role.ADMIN, Role.STAFF), c.createHostelRoom as any);
router.post('/hostel-allocate', restrictTo(Role.ADMIN, Role.STAFF), c.allocateHostel as any);

// Canteen
router.post('/menu', restrictTo(Role.ADMIN, Role.STAFF), c.createMenuItem as any);
router.get('/menu', c.listMenuItems as any);
router.post('/orders', restrictTo(Role.ADMIN, Role.STAFF, Role.STUDENT), c.createCanteenOrder as any);
router.get('/orders', c.listCanteenOrders as any);

// Sports
router.post('/sports', restrictTo(Role.ADMIN, Role.STAFF), c.createSport as any);
router.get('/sports', c.listSports as any);
router.post('/teams', restrictTo(Role.ADMIN, Role.STAFF), c.createTeam as any);
router.get('/teams', c.listTeams as any);
router.post('/matches', restrictTo(Role.ADMIN, Role.STAFF), c.scheduleMatch as any);
router.get('/matches', c.listMatches as any);

// Health
router.post('/health-records', restrictTo(Role.ADMIN, Role.STAFF), c.createHealthRecord as any);
router.get('/health-records', c.listHealthRecords as any);
router.post('/medical-visits', restrictTo(Role.ADMIN, Role.STAFF), c.createMedicalVisit as any);
router.get('/medical-visits', c.listMedicalVisits as any);

export default router;
