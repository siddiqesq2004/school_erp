"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const schoolController_1 = require("../controllers/schoolController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Protect all routes in this router
router.use(authMiddleware_1.protect);
// Classes & Sections
router.post('/classes', (0, authMiddleware_1.restrictTo)(authMiddleware_1.Role.ADMIN), schoolController_1.createClass);
router.get('/classes', schoolController_1.getClasses);
router.post('/sections', (0, authMiddleware_1.restrictTo)(authMiddleware_1.Role.ADMIN), schoolController_1.createSection);
// Students
router.post('/students', (0, authMiddleware_1.restrictTo)(authMiddleware_1.Role.ADMIN, authMiddleware_1.Role.STAFF), schoolController_1.registerStudent);
router.get('/students', schoolController_1.getStudents);
// Staff
router.post('/staff', (0, authMiddleware_1.restrictTo)(authMiddleware_1.Role.ADMIN), schoolController_1.registerStaff);
router.get('/staff', schoolController_1.getStaff);
exports.default = router;
