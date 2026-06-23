"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMedicalVisits = exports.createMedicalVisit = exports.listHealthRecords = exports.createHealthRecord = exports.listMatches = exports.scheduleMatch = exports.listTeams = exports.createTeam = exports.listSports = exports.createSport = exports.listCanteenOrders = exports.createCanteenOrder = exports.listMenuItems = exports.createMenuItem = exports.allocateHostel = exports.createHostelRoom = exports.listHostels = exports.createHostel = exports.listQuizzes = exports.createQuizQuestion = exports.createQuiz = exports.listVideoLessons = exports.createVideoLesson = exports.listCourses = exports.createCourse = void 0;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../utils/prisma"));
// Schemas
const courseSchema = zod_1.z.object({ title: zod_1.z.string().min(3), description: zod_1.z.string().optional() });
const lessonSchema = zod_1.z.object({ courseId: zod_1.z.string().uuid(), title: zod_1.z.string().min(3), videoUrl: zod_1.z.string().url(), duration: zod_1.z.number().int().optional() });
const quizSchema = zod_1.z.object({ courseId: zod_1.z.string().uuid(), title: zod_1.z.string().min(3) });
const quizQuestionSchema = zod_1.z.object({ quizId: zod_1.z.string().uuid(), question: zod_1.z.string().min(3), options: zod_1.z.array(zod_1.z.string()).min(2), answer: zod_1.z.string().min(1) });
const hostelSchema = zod_1.z.object({ name: zod_1.z.string().min(2), address: zod_1.z.string().optional() });
const hostelRoomSchema = zod_1.z.object({ hostelId: zod_1.z.string().uuid(), roomNo: zod_1.z.string().min(1), capacity: zod_1.z.number().int().min(1) });
const hostelAllocateSchema = zod_1.z.object({ roomId: zod_1.z.string().uuid(), studentId: zod_1.z.string().uuid(), fromDate: zod_1.z.string(), toDate: zod_1.z.string().optional() });
const menuItemSchema = zod_1.z.object({ name: zod_1.z.string().min(1), price: zod_1.z.number().positive(), available: zod_1.z.boolean().optional() });
const canteenOrderSchema = zod_1.z.object({ studentId: zod_1.z.string().uuid().optional(), items: zod_1.z.array(zod_1.z.object({ itemId: zod_1.z.string().uuid(), qty: zod_1.z.number().int().min(1) })).min(1) });
const sportSchema = zod_1.z.object({ name: zod_1.z.string().min(2) });
const teamSchema = zod_1.z.object({ sportId: zod_1.z.string().uuid(), name: zod_1.z.string().min(2), members: zod_1.z.array(zod_1.z.string().uuid()).optional() });
const matchSchema = zod_1.z.object({ sportId: zod_1.z.string().uuid(), teamAId: zod_1.z.string().uuid(), teamBId: zod_1.z.string().uuid(), date: zod_1.z.string() });
const healthRecordSchema = zod_1.z.object({ studentId: zod_1.z.string().uuid(), allergies: zod_1.z.string().optional(), medicalNotes: zod_1.z.string().optional() });
const medicalVisitSchema = zod_1.z.object({ studentId: zod_1.z.string().uuid(), visitDate: zod_1.z.string(), diagnosis: zod_1.z.string().optional(), prescription: zod_1.z.string().optional(), notes: zod_1.z.string().optional() });
// Helpers
const requireAuth = (req) => { if (!req.user)
    throw { status: 401, message: 'Unauthenticated' }; return req.user.schoolId; };
// LMS — Courses
const createCourse = async (req, res) => {
    try {
        const schoolId = requireAuth(req);
        const data = courseSchema.parse(req.body);
        const course = await prisma_1.default.course.create({ data: { ...data, schoolId } });
        return res.status(201).json({ success: true, data: course });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: err.errors[0].message });
        return res.status(err.status || 500).json({ success: false, message: err.message || 'Error creating course' });
    }
};
exports.createCourse = createCourse;
const listCourses = async (req, res) => {
    try {
        const schoolId = requireAuth(req);
        const courses = await prisma_1.default.course.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } });
        return res.status(200).json({ success: true, data: courses });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Error listing courses' });
    }
};
exports.listCourses = listCourses;
const createVideoLesson = async (req, res) => {
    try {
        requireAuth(req);
        const data = lessonSchema.parse(req.body);
        // ensure course exists and belongs to school
        const course = await prisma_1.default.course.findUnique({ where: { id: data.courseId } });
        if (!course)
            return res.status(404).json({ success: false, message: 'Course not found' });
        const lesson = await prisma_1.default.videoLesson.create({ data });
        return res.status(201).json({ success: true, data: lesson });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: err.errors[0].message });
        return res.status(500).json({ success: false, message: 'Error creating lesson' });
    }
};
exports.createVideoLesson = createVideoLesson;
const listVideoLessons = async (req, res) => {
    try {
        const schoolId = requireAuth(req);
        const { courseId } = req.query;
        const where = courseId
            ? { courseId: String(courseId), course: { schoolId } }
            : { course: { schoolId } };
        const lessons = await prisma_1.default.videoLesson.findMany({
            where,
            include: { course: true },
            orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json({ success: true, data: lessons });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Error listing lessons' });
    }
};
exports.listVideoLessons = listVideoLessons;
// Quiz
const createQuiz = async (req, res) => {
    try {
        requireAuth(req);
        const data = quizSchema.parse(req.body);
        const quiz = await prisma_1.default.quiz.create({ data });
        return res.status(201).json({ success: true, data: quiz });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: err.errors[0].message });
        return res.status(500).json({ success: false, message: 'Error creating quiz' });
    }
};
exports.createQuiz = createQuiz;
const createQuizQuestion = async (req, res) => {
    try {
        requireAuth(req);
        const data = quizQuestionSchema.parse(req.body);
        const question = await prisma_1.default.quizQuestion.create({ data: { ...data, options: JSON.stringify(data.options) } });
        return res.status(201).json({ success: true, data: question });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: err.errors[0].message });
        return res.status(500).json({ success: false, message: 'Error creating question' });
    }
};
exports.createQuizQuestion = createQuizQuestion;
const listQuizzes = async (req, res) => {
    try {
        const schoolId = requireAuth(req);
        const quizzes = await prisma_1.default.quiz.findMany({
            where: { course: { schoolId } },
            include: { questions: true, course: true },
            orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json({ success: true, data: quizzes });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Error listing quizzes' });
    }
};
exports.listQuizzes = listQuizzes;
// Hostel
const createHostel = async (req, res) => {
    try {
        const schoolId = requireAuth(req);
        const data = hostelSchema.parse(req.body);
        const hostel = await prisma_1.default.hostel.create({ data: { ...data, schoolId } });
        return res.status(201).json({ success: true, data: hostel });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: err.errors[0].message });
        return res.status(500).json({ success: false, message: 'Error creating hostel' });
    }
};
exports.createHostel = createHostel;
const listHostels = async (req, res) => {
    try {
        const schoolId = requireAuth(req);
        const hostels = await prisma_1.default.hostel.findMany({
            where: { schoolId },
            include: {
                rooms: {
                    include: {
                        allocations: {
                            include: {
                                student: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json({ success: true, data: hostels });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Error listing hostels' });
    }
};
exports.listHostels = listHostels;
const createHostelRoom = async (req, res) => {
    try {
        requireAuth(req);
        const data = hostelRoomSchema.parse(req.body);
        const hostel = await prisma_1.default.hostel.findUnique({ where: { id: data.hostelId } });
        if (!hostel)
            return res.status(404).json({ success: false, message: 'Hostel not found' });
        const room = await prisma_1.default.hostelRoom.create({ data });
        return res.status(201).json({ success: true, data: room });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: err.errors[0].message });
        return res.status(500).json({ success: false, message: 'Error creating room' });
    }
};
exports.createHostelRoom = createHostelRoom;
const allocateHostel = async (req, res) => {
    try {
        requireAuth(req);
        const data = hostelAllocateSchema.parse(req.body);
        const room = await prisma_1.default.hostelRoom.findUnique({ where: { id: data.roomId }, include: { allocations: true } });
        if (!room)
            return res.status(404).json({ success: false, message: 'Room not found' });
        const student = await prisma_1.default.studentProfile.findUnique({ where: { id: data.studentId } });
        if (!student)
            return res.status(404).json({ success: false, message: 'Student not found' });
        const current = room.allocations.length;
        if (current >= room.capacity)
            return res.status(400).json({ success: false, message: 'Room is full' });
        const alloc = await prisma_1.default.hostelAllocation.create({ data });
        return res.status(201).json({ success: true, data: alloc });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: err.errors[0].message });
        return res.status(500).json({ success: false, message: 'Error allocating hostel' });
    }
};
exports.allocateHostel = allocateHostel;
// Canteen
const createMenuItem = async (req, res) => {
    try {
        const schoolId = requireAuth(req);
        const data = menuItemSchema.parse(req.body);
        const item = await prisma_1.default.menuItem.create({ data: { ...data, schoolId } });
        return res.status(201).json({ success: true, data: item });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: err.errors[0].message });
        return res.status(500).json({ success: false, message: 'Error creating menu item' });
    }
};
exports.createMenuItem = createMenuItem;
const listMenuItems = async (req, res) => {
    try {
        const schoolId = requireAuth(req);
        const items = await prisma_1.default.menuItem.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } });
        return res.status(200).json({ success: true, data: items });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Error listing menu items' });
    }
};
exports.listMenuItems = listMenuItems;
const createCanteenOrder = async (req, res) => {
    try {
        const schoolId = requireAuth(req);
        const data = canteenOrderSchema.parse(req.body);
        const itemIds = data.items.map((i) => i.itemId);
        const dbItems = await prisma_1.default.menuItem.findMany({ where: { id: { in: itemIds } } });
        const priceMap = {};
        dbItems.forEach((it) => (priceMap[it.id] = it.price));
        let total = 0;
        for (const it of data.items) {
            const price = priceMap[it.itemId];
            if (price === undefined)
                return res.status(400).json({ success: false, message: `Menu item ${it.itemId} not found` });
            total += price * it.qty;
        }
        const order = await prisma_1.default.canteenOrder.create({ data: { schoolId, studentId: data.studentId, items: JSON.stringify(data.items), total, orderedAt: new Date().toISOString() } });
        return res.status(201).json({ success: true, data: order });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: err.errors[0].message });
        return res.status(500).json({ success: false, message: 'Error creating order' });
    }
};
exports.createCanteenOrder = createCanteenOrder;
const listCanteenOrders = async (req, res) => {
    try {
        const schoolId = requireAuth(req);
        const orders = await prisma_1.default.canteenOrder.findMany({
            where: { schoolId },
            include: { student: true },
            orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json({ success: true, data: orders });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Error listing canteen orders' });
    }
};
exports.listCanteenOrders = listCanteenOrders;
// Sports
const createSport = async (req, res) => {
    try {
        const schoolId = requireAuth(req);
        const data = sportSchema.parse(req.body);
        const sport = await prisma_1.default.sport.create({ data: { ...data, schoolId } });
        return res.status(201).json({ success: true, data: sport });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: err.errors[0].message });
        return res.status(500).json({ success: false, message: 'Error creating sport' });
    }
};
exports.createSport = createSport;
const listSports = async (req, res) => {
    try {
        const schoolId = requireAuth(req);
        const sports = await prisma_1.default.sport.findMany({
            where: { schoolId },
            include: { teams: true, matches: true },
            orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json({ success: true, data: sports });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Error listing sports' });
    }
};
exports.listSports = listSports;
const createTeam = async (req, res) => {
    try {
        requireAuth(req);
        const data = teamSchema.parse(req.body);
        const team = await prisma_1.default.team.create({ data: { ...data, members: data.members ? JSON.stringify(data.members) : '[]' } });
        return res.status(201).json({ success: true, data: team });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: err.errors[0].message });
        return res.status(500).json({ success: false, message: 'Error creating team' });
    }
};
exports.createTeam = createTeam;
const listTeams = async (req, res) => {
    try {
        const schoolId = requireAuth(req);
        const teams = await prisma_1.default.team.findMany({
            where: { sport: { schoolId } },
            include: { sport: true },
            orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json({ success: true, data: teams });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Error listing teams' });
    }
};
exports.listTeams = listTeams;
const scheduleMatch = async (req, res) => {
    try {
        requireAuth(req);
        const data = matchSchema.parse(req.body);
        const match = await prisma_1.default.match.create({ data });
        return res.status(201).json({ success: true, data: match });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: err.errors[0].message });
        return res.status(500).json({ success: false, message: 'Error scheduling match' });
    }
};
exports.scheduleMatch = scheduleMatch;
const listMatches = async (req, res) => {
    try {
        const schoolId = requireAuth(req);
        const matches = await prisma_1.default.match.findMany({
            where: { sport: { schoolId } },
            include: { sport: true },
            orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json({ success: true, data: matches });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Error listing matches' });
    }
};
exports.listMatches = listMatches;
// Health
const createHealthRecord = async (req, res) => {
    try {
        requireAuth(req);
        const data = healthRecordSchema.parse(req.body);
        const record = await prisma_1.default.healthRecord.create({ data });
        return res.status(201).json({ success: true, data: record });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: err.errors[0].message });
        return res.status(500).json({ success: false, message: 'Error creating health record' });
    }
};
exports.createHealthRecord = createHealthRecord;
const listHealthRecords = async (req, res) => {
    try {
        const schoolId = requireAuth(req);
        const records = await prisma_1.default.healthRecord.findMany({
            where: { student: { user: { schoolId } } },
            include: { student: true },
            orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json({ success: true, data: records });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Error listing health records' });
    }
};
exports.listHealthRecords = listHealthRecords;
const createMedicalVisit = async (req, res) => {
    try {
        requireAuth(req);
        const data = medicalVisitSchema.parse(req.body);
        const visit = await prisma_1.default.medicalVisit.create({ data });
        return res.status(201).json({ success: true, data: visit });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: err.errors[0].message });
        return res.status(500).json({ success: false, message: 'Error creating medical visit' });
    }
};
exports.createMedicalVisit = createMedicalVisit;
const listMedicalVisits = async (req, res) => {
    try {
        const schoolId = requireAuth(req);
        const visits = await prisma_1.default.medicalVisit.findMany({
            where: { student: { user: { schoolId } } },
            include: { student: true },
            orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json({ success: true, data: visits });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Error listing medical visits' });
    }
};
exports.listMedicalVisits = listMedicalVisits;
exports.default = {};
