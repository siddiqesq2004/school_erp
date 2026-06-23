"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const phase9Controller_1 = require("../controllers/phase9Controller");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.protect);
// UDISE
router.post('/udise', (0, authMiddleware_1.restrictTo)(authMiddleware_1.Role.ADMIN, authMiddleware_1.Role.STAFF), phase9Controller_1.createUDISE);
router.get('/udise', phase9Controller_1.listUDISE);
// Board
router.post('/boards', (0, authMiddleware_1.restrictTo)(authMiddleware_1.Role.ADMIN, authMiddleware_1.Role.STAFF), phase9Controller_1.createBoard);
router.get('/boards', phase9Controller_1.listBoards);
// Government reports
router.post('/reports', (0, authMiddleware_1.restrictTo)(authMiddleware_1.Role.ADMIN, authMiddleware_1.Role.STAFF), phase9Controller_1.submitReport);
router.get('/reports', phase9Controller_1.listReports);
// Admissions
router.post('/admissions', (0, authMiddleware_1.restrictTo)(authMiddleware_1.Role.ADMIN, authMiddleware_1.Role.STAFF), phase9Controller_1.createAdmission);
router.get('/admissions', phase9Controller_1.listAdmissions);
router.patch('/admissions/:id/status', (0, authMiddleware_1.restrictTo)(authMiddleware_1.Role.ADMIN, authMiddleware_1.Role.STAFF), phase9Controller_1.updateAdmissionStatus);
// Summary
router.get('/summary', phase9Controller_1.phase9Summary);
exports.default = router;
