"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const c = __importStar(require("../controllers/phase10Controller"));
const router = (0, express_1.Router)();
router.use(authMiddleware_1.protect);
// LMS
router.post('/courses', (0, authMiddleware_1.restrictTo)(authMiddleware_1.Role.ADMIN, authMiddleware_1.Role.STAFF), c.createCourse);
router.get('/courses', c.listCourses);
router.post('/lessons', (0, authMiddleware_1.restrictTo)(authMiddleware_1.Role.ADMIN, authMiddleware_1.Role.STAFF), c.createVideoLesson);
router.get('/lessons', c.listVideoLessons);
router.post('/quizzes', (0, authMiddleware_1.restrictTo)(authMiddleware_1.Role.ADMIN, authMiddleware_1.Role.STAFF), c.createQuiz);
router.post('/quiz-questions', (0, authMiddleware_1.restrictTo)(authMiddleware_1.Role.ADMIN, authMiddleware_1.Role.STAFF), c.createQuizQuestion);
router.get('/quizzes', c.listQuizzes);
// Hostel
router.post('/hostels', (0, authMiddleware_1.restrictTo)(authMiddleware_1.Role.ADMIN, authMiddleware_1.Role.STAFF), c.createHostel);
router.get('/hostels', c.listHostels);
router.post('/hostel-rooms', (0, authMiddleware_1.restrictTo)(authMiddleware_1.Role.ADMIN, authMiddleware_1.Role.STAFF), c.createHostelRoom);
router.post('/hostel-allocate', (0, authMiddleware_1.restrictTo)(authMiddleware_1.Role.ADMIN, authMiddleware_1.Role.STAFF), c.allocateHostel);
// Canteen
router.post('/menu', (0, authMiddleware_1.restrictTo)(authMiddleware_1.Role.ADMIN, authMiddleware_1.Role.STAFF), c.createMenuItem);
router.get('/menu', c.listMenuItems);
router.post('/orders', (0, authMiddleware_1.restrictTo)(authMiddleware_1.Role.ADMIN, authMiddleware_1.Role.STAFF, authMiddleware_1.Role.STUDENT), c.createCanteenOrder);
router.get('/orders', c.listCanteenOrders);
// Sports
router.post('/sports', (0, authMiddleware_1.restrictTo)(authMiddleware_1.Role.ADMIN, authMiddleware_1.Role.STAFF), c.createSport);
router.get('/sports', c.listSports);
router.post('/teams', (0, authMiddleware_1.restrictTo)(authMiddleware_1.Role.ADMIN, authMiddleware_1.Role.STAFF), c.createTeam);
router.get('/teams', c.listTeams);
router.post('/matches', (0, authMiddleware_1.restrictTo)(authMiddleware_1.Role.ADMIN, authMiddleware_1.Role.STAFF), c.scheduleMatch);
router.get('/matches', c.listMatches);
// Health
router.post('/health-records', (0, authMiddleware_1.restrictTo)(authMiddleware_1.Role.ADMIN, authMiddleware_1.Role.STAFF), c.createHealthRecord);
router.get('/health-records', c.listHealthRecords);
router.post('/medical-visits', (0, authMiddleware_1.restrictTo)(authMiddleware_1.Role.ADMIN, authMiddleware_1.Role.STAFF), c.createMedicalVisit);
router.get('/medical-visits', c.listMedicalVisits);
exports.default = router;
