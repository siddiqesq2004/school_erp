import { Router } from 'express';
import {
  createVehicle,
  getVehicles,
  createRoute,
  getRoutes,
  assignStudentRoute,
  getAllocations,
  addGPSLocation,
  getLatestGPSLocation,
} from '../controllers/transportController';
import { protect, restrictTo, Role } from '../middlewares/authMiddleware';

const router = Router();
router.use(protect as any);

router.get('/vehicles', getVehicles as any);
router.post('/vehicles', restrictTo(Role.ADMIN, Role.STAFF), createVehicle as any);

router.get('/routes', getRoutes as any);
router.post('/routes', restrictTo(Role.ADMIN, Role.STAFF), createRoute as any);

router.get('/allocations', getAllocations as any);
router.post('/allocations', restrictTo(Role.ADMIN, Role.STAFF), assignStudentRoute as any);

router.post('/gps', restrictTo(Role.ADMIN, Role.STAFF), addGPSLocation as any);
router.get('/gps/latest', getLatestGPSLocation as any);

export default router;
