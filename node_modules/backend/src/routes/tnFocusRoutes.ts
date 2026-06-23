import { Router } from 'express';
import { protect } from '../middlewares/authMiddleware';
import * as ctrl from '../controllers/tnFocusController';

const router = Router();

router.use(protect);

// Samacheer config
router.get('/samacheer/config', ctrl.getSamacheerConfig);
router.put('/samacheer/config', ctrl.updateSamacheerConfig);

// Samacheer marks
router.post('/samacheer/marks', ctrl.enterSamacheerMark);
router.get('/samacheer/marks', ctrl.listSamacheerMarks);
router.get('/samacheer/marks/:studentId/:academicYear/annual', ctrl.computeStudentAnnual);

// Tamil templates
router.get('/tamil/templates', ctrl.listTamilTemplates);
router.post('/tamil/templates', ctrl.createTamilTemplate);
router.post('/tamil/templates/preview', ctrl.previewTamilTemplate);
router.post('/tamil/templates/seed-defaults', ctrl.seedDefaultTamilTemplates);

// Aided grants
router.get('/aided-grants', ctrl.listAidedGrants);
router.post('/aided-grants', ctrl.createAidedGrant);
router.put('/aided-grants/:id/receive', ctrl.receiveGrant);
router.post('/aided-grants/:id/claims', ctrl.createGrantClaim);
router.post('/aided-grants/claims/:id/generate-uc', ctrl.generateUC);
router.get('/aided-grants/summary', ctrl.grantSummary);

export default router;
