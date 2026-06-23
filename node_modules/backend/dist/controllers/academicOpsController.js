"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPortalSummary = exports.createParentAccess = exports.updateHomeworkSubmission = exports.getHomework = exports.createHomework = exports.updateLessonPlanStatus = exports.getLessonPlans = exports.createLessonPlan = exports.getTimetable = exports.deleteTimetableSlots = exports.deleteTimetableSlot = exports.updateTimetableSlot = exports.createTimetableSlot = exports.generateTimetable = void 0;
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const dateSchema = zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const slotSchema = zod_1.z.object({
    classId: zod_1.z.string().min(1),
    sectionId: zod_1.z.string().optional(),
    staffId: zod_1.z.string().optional(),
    dayOfWeek: zod_1.z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']),
    periodNo: zod_1.z.coerce.number().int().positive(),
    subject: zod_1.z.string().min(1),
    startTime: zod_1.z.string().optional(),
    endTime: zod_1.z.string().optional(),
    room: zod_1.z.string().optional(),
});
const bulkDeleteSchema = zod_1.z.object({
    ids: zod_1.z.array(zod_1.z.string().min(1)).min(1),
});
const generatorSchema = zod_1.z.object({
    classId: zod_1.z.string().min(1),
    sectionId: zod_1.z.string().optional(),
    days: zod_1.z.array(zod_1.z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'])).default(days),
    periodsPerDay: zod_1.z.coerce.number().int().min(1).max(12),
    subjects: zod_1.z.array(zod_1.z.object({
        subject: zod_1.z.string().min(1),
        staffId: zod_1.z.string().optional(),
        periodsPerWeek: zod_1.z.coerce.number().int().min(1),
    })).min(1),
});
const lessonSchema = zod_1.z.object({
    staffId: zod_1.z.string().min(1),
    classId: zod_1.z.string().min(1),
    subject: zod_1.z.string().min(1),
    weekStart: dateSchema,
    objectives: zod_1.z.string().min(1),
    activities: zod_1.z.string().optional(),
    resources: zod_1.z.string().optional(),
    status: zod_1.z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REWORK']).optional(),
    reviewerNote: zod_1.z.string().optional(),
});
const homeworkSchema = zod_1.z.object({
    staffId: zod_1.z.string().min(1),
    classId: zod_1.z.string().min(1),
    sectionId: zod_1.z.string().optional(),
    subject: zod_1.z.string().min(1),
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
    dueDate: dateSchema,
    status: zod_1.z.enum(['DRAFT', 'PUBLISHED', 'CLOSED']).optional(),
});
const submissionSchema = zod_1.z.object({
    studentId: zod_1.z.string().min(1),
    status: zod_1.z.enum(['PENDING', 'SUBMITTED', 'REVIEWED']),
    remarks: zod_1.z.string().optional(),
});
const parentSchema = zod_1.z.object({
    studentId: zod_1.z.string().min(1),
    username: zod_1.z.string().min(3),
    password: zod_1.z.string().min(6),
    relation: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    phone: zod_1.z.string().min(5),
    email: zod_1.z.string().email().optional(),
    occupation: zod_1.z.string().optional(),
});
const assertClass = async (classId, schoolId) => prisma_1.default.class.findFirst({ where: { id: classId, schoolId } });
const assertStaff = async (staffId, schoolId) => prisma_1.default.staffProfile.findFirst({ where: { id: staffId, user: { schoolId } } });
const generateTimetable = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = generatorSchema.parse(req.body);
        if (!(await assertClass(data.classId, req.user.schoolId)))
            return res.status(404).json({ success: false, message: 'Class not found' });
        const pool = data.subjects.flatMap((subject) => Array.from({ length: subject.periodsPerWeek }, () => ({ subject: subject.subject, staffId: subject.staffId })));
        const capacity = data.days.length * data.periodsPerDay;
        if (pool.length > capacity)
            return res.status(400).json({ success: false, message: 'Subject periods exceed weekly timetable capacity' });
        await prisma_1.default.timetableSlot.deleteMany({ where: { classId: data.classId, sectionId: data.sectionId || null } });
        const created = [];
        let index = 0;
        for (const dayOfWeek of data.days) {
            for (let periodNo = 1; periodNo <= data.periodsPerDay; periodNo += 1) {
                const item = pool[index];
                if (!item)
                    break;
                created.push(await prisma_1.default.timetableSlot.create({
                    data: {
                        schoolId: req.user.schoolId,
                        classId: data.classId,
                        sectionId: data.sectionId,
                        dayOfWeek,
                        periodNo,
                        subject: item.subject,
                        staffId: item.staffId,
                    },
                    include: { class: true, section: true, staff: true },
                }));
                index += 1;
            }
        }
        return res.status(201).json({ success: true, message: `Generated ${created.length} timetable slots`, data: created });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: error.errors[0].message });
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error generating timetable' });
    }
};
exports.generateTimetable = generateTimetable;
const createTimetableSlot = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = slotSchema.parse(req.body);
        if (!(await assertClass(data.classId, req.user.schoolId)))
            return res.status(404).json({ success: false, message: 'Class not found' });
        if (data.staffId && !(await assertStaff(data.staffId, req.user.schoolId)))
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        const existing = await prisma_1.default.timetableSlot.findFirst({
            where: { classId: data.classId, sectionId: data.sectionId || null, dayOfWeek: data.dayOfWeek, periodNo: data.periodNo },
        });
        const slot = existing
            ? await prisma_1.default.timetableSlot.update({ where: { id: existing.id }, data, include: { class: true, section: true, staff: true } })
            : await prisma_1.default.timetableSlot.create({ data: { ...data, schoolId: req.user.schoolId }, include: { class: true, section: true, staff: true } });
        return res.status(200).json({ success: true, data: slot });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: error.errors[0].message });
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error saving timetable slot' });
    }
};
exports.createTimetableSlot = createTimetableSlot;
const updateTimetableSlot = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = slotSchema.parse(req.body);
        const slot = await prisma_1.default.timetableSlot.findFirst({ where: { id: req.params.slotId, schoolId: req.user.schoolId } });
        if (!slot)
            return res.status(404).json({ success: false, message: 'Timetable slot not found' });
        if (!(await assertClass(data.classId, req.user.schoolId)))
            return res.status(404).json({ success: false, message: 'Class not found' });
        if (data.staffId && !(await assertStaff(data.staffId, req.user.schoolId)))
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        const updated = await prisma_1.default.timetableSlot.update({
            where: { id: slot.id },
            data,
            include: { class: true, section: true, staff: true },
        });
        return res.status(200).json({ success: true, data: updated });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: error.errors[0].message });
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error updating timetable slot' });
    }
};
exports.updateTimetableSlot = updateTimetableSlot;
const deleteTimetableSlot = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const slot = await prisma_1.default.timetableSlot.findFirst({ where: { id: req.params.slotId, schoolId: req.user.schoolId } });
        if (!slot)
            return res.status(404).json({ success: false, message: 'Timetable slot not found' });
        await prisma_1.default.timetableSlot.delete({ where: { id: slot.id } });
        return res.status(200).json({ success: true, message: 'Timetable slot deleted' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error deleting timetable slot' });
    }
};
exports.deleteTimetableSlot = deleteTimetableSlot;
const deleteTimetableSlots = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const { ids } = bulkDeleteSchema.parse(req.body);
        const result = await prisma_1.default.timetableSlot.deleteMany({
            where: { schoolId: req.user.schoolId, id: { in: ids } },
        });
        return res.status(200).json({ success: true, message: `Deleted ${result.count} timetable slots` });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: error.errors[0].message });
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error deleting timetable slots' });
    }
};
exports.deleteTimetableSlots = deleteTimetableSlots;
const getTimetable = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const { classId, staffId } = req.query;
        const slots = await prisma_1.default.timetableSlot.findMany({
            where: {
                schoolId: req.user.schoolId,
                ...(classId ? { classId: classId } : {}),
                ...(staffId ? { staffId: staffId } : {}),
            },
            include: { class: true, section: true, staff: true },
            orderBy: [{ dayOfWeek: 'asc' }, { periodNo: 'asc' }],
        });
        return res.status(200).json({ success: true, data: slots });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching timetable' });
    }
};
exports.getTimetable = getTimetable;
const createLessonPlan = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = lessonSchema.parse(req.body);
        if (!(await assertStaff(data.staffId, req.user.schoolId)))
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        if (!(await assertClass(data.classId, req.user.schoolId)))
            return res.status(404).json({ success: false, message: 'Class not found' });
        const plan = await prisma_1.default.lessonPlan.create({ data: { ...data, schoolId: req.user.schoolId }, include: { staff: true, class: true } });
        return res.status(201).json({ success: true, data: plan });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: error.errors[0].message });
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error saving lesson plan' });
    }
};
exports.createLessonPlan = createLessonPlan;
const getLessonPlans = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const plans = await prisma_1.default.lessonPlan.findMany({
            where: { class: { schoolId: req.user.schoolId } },
            include: { staff: true, class: true },
            orderBy: { weekStart: 'desc' },
        });
        return res.status(200).json({ success: true, data: plans });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching lesson plans' });
    }
};
exports.getLessonPlans = getLessonPlans;
const updateLessonPlanStatus = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = zod_1.z.object({ status: zod_1.z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REWORK']), reviewerNote: zod_1.z.string().optional() }).parse(req.body);
        const plan = await prisma_1.default.lessonPlan.findFirst({ where: { id: req.params.planId, class: { schoolId: req.user.schoolId } } });
        if (!plan)
            return res.status(404).json({ success: false, message: 'Lesson plan not found' });
        const updated = await prisma_1.default.lessonPlan.update({ where: { id: plan.id }, data });
        return res.status(200).json({ success: true, data: updated });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: error.errors[0].message });
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error updating lesson plan' });
    }
};
exports.updateLessonPlanStatus = updateLessonPlanStatus;
const createHomework = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = homeworkSchema.parse(req.body);
        if (!(await assertStaff(data.staffId, req.user.schoolId)))
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        if (!(await assertClass(data.classId, req.user.schoolId)))
            return res.status(404).json({ success: false, message: 'Class not found' });
        const homework = await prisma_1.default.homework.create({ data: { ...data, schoolId: req.user.schoolId }, include: { staff: true, class: true, section: true } });
        const students = await prisma_1.default.studentProfile.findMany({ where: { classId: data.classId, ...(data.sectionId ? { sectionId: data.sectionId } : {}), user: { schoolId: req.user.schoolId } } });
        await prisma_1.default.homeworkSubmission.createMany({ data: students.map((student) => ({ homeworkId: homework.id, studentId: student.id })) });
        return res.status(201).json({ success: true, message: `Homework assigned to ${students.length} students`, data: homework });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: error.errors[0].message });
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error assigning homework' });
    }
};
exports.createHomework = createHomework;
const getHomework = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const homework = await prisma_1.default.homework.findMany({
            where: { class: { schoolId: req.user.schoolId } },
            include: { staff: true, class: true, section: true, submissions: { include: { student: true } } },
            orderBy: { dueDate: 'desc' },
        });
        return res.status(200).json({ success: true, data: homework });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching homework' });
    }
};
exports.getHomework = getHomework;
const updateHomeworkSubmission = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = submissionSchema.parse(req.body);
        const homework = await prisma_1.default.homework.findFirst({ where: { id: req.params.homeworkId, class: { schoolId: req.user.schoolId } } });
        if (!homework)
            return res.status(404).json({ success: false, message: 'Homework not found' });
        const submission = await prisma_1.default.homeworkSubmission.upsert({
            where: { homeworkId_studentId: { homeworkId: homework.id, studentId: data.studentId } },
            update: { status: data.status, remarks: data.remarks, submittedAt: data.status === 'SUBMITTED' ? new Date().toISOString().slice(0, 10) : undefined },
            create: { homeworkId: homework.id, studentId: data.studentId, status: data.status, remarks: data.remarks, submittedAt: data.status === 'SUBMITTED' ? new Date().toISOString().slice(0, 10) : undefined },
        });
        return res.status(200).json({ success: true, data: submission });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: error.errors[0].message });
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error updating homework submission' });
    }
};
exports.updateHomeworkSubmission = updateHomeworkSubmission;
const createParentAccess = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = parentSchema.parse(req.body);
        const student = await prisma_1.default.studentProfile.findFirst({ where: { id: data.studentId, user: { schoolId: req.user.schoolId } } });
        if (!student)
            return res.status(404).json({ success: false, message: 'Student not found' });
        if (await prisma_1.default.user.findUnique({ where: { username: data.username.toLowerCase() } }))
            return res.status(400).json({ success: false, message: 'Username is already taken' });
        const password = await bcryptjs_1.default.hash(data.password, 10);
        const result = await prisma_1.default.$transaction(async (tx) => {
            const user = await tx.user.create({ data: { schoolId: req.user.schoolId, username: data.username.toLowerCase(), password, email: data.email, role: authMiddleware_1.Role.PARENT } });
            const parent = await tx.parentProfile.create({ data: { userId: user.id, studentId: data.studentId, relation: data.relation, name: data.name, phone: data.phone, email: data.email, occupation: data.occupation } });
            return { user, parent };
        });
        return res.status(201).json({ success: true, data: result });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: error.errors[0].message });
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error creating parent access' });
    }
};
exports.createParentAccess = createParentAccess;
const getPortalSummary = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.id },
            include: { studentProfile: true, parentProfile: { include: { student: true } } },
        });
        const student = user?.studentProfile || user?.parentProfile?.student;
        if (!student)
            return res.status(404).json({ success: false, message: 'No linked student profile found' });
        const [timetable, homework, attendance, circulars, feePayments, marks] = await Promise.all([
            prisma_1.default.timetableSlot.findMany({ where: { classId: student.classId || undefined, OR: [{ sectionId: student.sectionId }, { sectionId: null }] }, include: { staff: true }, orderBy: [{ dayOfWeek: 'asc' }, { periodNo: 'asc' }] }),
            prisma_1.default.homework.findMany({ where: { classId: student.classId || undefined, OR: [{ sectionId: student.sectionId }, { sectionId: null }] }, include: { submissions: { where: { studentId: student.id } } }, orderBy: { dueDate: 'desc' } }),
            prisma_1.default.attendance.findMany({ where: { studentId: student.id }, orderBy: { date: 'desc' }, take: 30 }),
            prisma_1.default.circular.findMany({ where: { schoolId: req.user.schoolId, status: 'PUBLISHED', OR: [{ audience: 'ALL' }, { audience: 'PARENTS' }, { audience: 'STUDENTS' }, { classId: student.classId }] }, orderBy: { createdAt: 'desc' }, take: 20 }),
            prisma_1.default.feePayment.findMany({ where: { studentId: student.id }, include: { feeStructure: true }, orderBy: { dueDate: 'desc' } }),
            prisma_1.default.mark.findMany({ where: { studentId: student.id }, include: { examSubject: { include: { exam: true } } }, orderBy: { id: 'desc' } }),
        ]);
        return res.status(200).json({ success: true, data: { student, timetable, homework, attendance, circulars, feePayments, marks } });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error loading portal summary' });
    }
};
exports.getPortalSummary = getPortalSummary;
