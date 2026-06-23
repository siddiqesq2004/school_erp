import { Router } from 'express';
import {
  createBook,
  getBooks,
  getIssues,
  issueBook,
  returnBook,
  getLibrarySummary,
} from '../controllers/libraryController';
import { protect, restrictTo, Role } from '../middlewares/authMiddleware';

const router = Router();
router.use(protect as any);

router.get('/books', getBooks as any);
router.post('/books', restrictTo(Role.ADMIN, Role.STAFF), createBook as any);
router.get('/issues', getIssues as any);
router.post('/issues', restrictTo(Role.ADMIN, Role.STAFF), issueBook as any);
router.post('/issues/return', restrictTo(Role.ADMIN, Role.STAFF), returnBook as any);
router.get('/summary', getLibrarySummary as any);

export default router;
