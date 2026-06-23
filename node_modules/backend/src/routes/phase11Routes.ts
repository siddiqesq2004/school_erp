import { Router } from 'express';
import { protect, restrictTo, Role } from '../middlewares/authMiddleware';
import * as ctrl from '../controllers/phase11Controller';

const router = Router();

router.use(protect);

// Branches
router.get('/branches', ctrl.listBranches);
router.post('/branches', restrictTo(Role.ADMIN), ctrl.createBranch);
router.put('/branches/:id', restrictTo(Role.ADMIN), ctrl.updateBranch);
router.delete('/branches/:id', restrictTo(Role.ADMIN), ctrl.deleteBranch);
router.get('/branches/report/consolidated', ctrl.branchConsolidatedReport);

// White-label
router.get('/white-label', ctrl.getWhiteLabel);
router.put('/white-label', restrictTo(Role.ADMIN), ctrl.updateWhiteLabel);

// API keys
router.get('/api-keys', ctrl.listAPIKeys);
router.post('/api-keys', restrictTo(Role.ADMIN), ctrl.createAPIKey);
router.put('/api-keys/:id/revoke', restrictTo(Role.ADMIN), ctrl.revokeAPIKey);

// Audit logs
router.get('/audit-logs', restrictTo(Role.ADMIN), ctrl.listAuditLogs);

// Custom reports
router.get('/custom-reports', ctrl.listCustomReports);
router.post('/custom-reports', restrictTo(Role.ADMIN, Role.HOD), ctrl.createCustomReport);
router.post('/custom-reports/:id/run', ctrl.runCustomReport);

// Advanced analytics
router.get('/analytics/advanced', ctrl.getAdvancedAnalytics);

export default router;
