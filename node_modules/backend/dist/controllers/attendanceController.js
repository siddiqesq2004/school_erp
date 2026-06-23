"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStaffAttendance = exports.markStaffAttendance = exports.getAttendanceReport = exports.getStudentAttendance = exports.markStudentAttendance = void 0;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../utils/prisma"));
// ── Schemas ──
const markAttendanceSchema = zod_1.z.object({
    classId: zod_1.z.string().min(1),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    records: zod_1.z.array(zod_1.z.object({
        studentId: zod_1.z.string().min(1),
        status: zod_1.z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY']),
        remarks: zod_1.z.string().optional(),
    })),
});
const staffAttendanceSchema = zod_1.z.object({
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    records: zod_1.z.array(zod_1.z.object({
        staffId: zod_1.z.string().min(1),
        status: zod_1.z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE']),
        checkIn: zod_1.z.string().optional(),
        checkOut: zod_1.z.string().optional(),
        remarks: zod_1.z.string().optional(),
    })),
});
// ── Mark Student Attendance (bulk for a class on a date) ──
const markStudentAttendance = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const { classId, date, records } = markAttendanceSchema.parse(req.body);
        // Verify class belongs to school
        const cls = await prisma_1.default.class.findFirst({
            where: { id: classId, schoolId: req.user.schoolId },
        });
        if (!cls)
            return res.status(404).json({ success: false, message: 'Class not found' });
        // Upsert each record
        const results = [];
        for (const rec of records) {
            const result = await prisma_1.default.attendance.upsert({
                where: { studentId_date: { studentId: rec.studentId, date } },
                update: { status: rec.status, remarks: rec.remarks, markedBy: req.user.id },
                create: {
                    studentId: rec.studentId,
                    date,
                    status: rec.status,
                    remarks: rec.remarks,
                    markedBy: req.user.id,
                },
            });
            results.push(result);
        }
        return res.status(200).json({ success: true, message: `Marked attendance for ${results.length} students`, data: results });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: error.errors[0].message });
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error marking attendance' });
    }
};
exports.markStudentAttendance = markStudentAttendance;
// ── Get Student Attendance for a class on a date ──
const getStudentAttendance = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const { classId, date } = req.query;
        if (!classId || !date)
            return res.status(400).json({ success: false, message: 'classId and date required' });
        // Get all students in this class
        const students = await prisma_1.default.studentProfile.findMany({
            where: { classId: classId, user: { schoolId: req.user.schoolId } },
            include: { section: true },
            orderBy: { firstName: 'asc' },
        });
        // Get attendance records for these students on this date
        const attendance = await prisma_1.default.attendance.findMany({
            where: { date: date, studentId: { in: students.map(s => s.id) } },
        });
        const attendanceMap = new Map(attendance.map(a => [a.studentId, a]));
        const result = students.map(s => ({
            studentId: s.id,
            admissionNo: s.admissionNo,
            rollNo: s.rollNo,
            firstName: s.firstName,
            lastName: s.lastName,
            section: s.section?.name || '',
            status: attendanceMap.get(s.id)?.status || null,
            remarks: attendanceMap.get(s.id)?.remarks || '',
        }));
        return res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching attendance' });
    }
};
exports.getStudentAttendance = getStudentAttendance;
// ── Monthly Attendance Report ──
const getAttendanceReport = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const { classId, month, year } = req.query;
        if (!classId || !month || !year)
            return res.status(400).json({ success: false, message: 'classId, month, year required' });
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
        const students = await prisma_1.default.studentProfile.findMany({
            where: { classId: classId, user: { schoolId: req.user.schoolId } },
            orderBy: { firstName: 'asc' },
        });
        const attendance = await prisma_1.default.attendance.findMany({
            where: {
                studentId: { in: students.map(s => s.id) },
                date: { gte: startDate, lte: endDate },
            },
        });
        const report = students.map(s => {
            const studentRecords = attendance.filter(a => a.studentId === s.id);
            const present = studentRecords.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
            const absent = studentRecords.filter(a => a.status === 'ABSENT').length;
            const halfDay = studentRecords.filter(a => a.status === 'HALF_DAY').length;
            const totalDays = studentRecords.length;
            const percentage = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;
            return {
                studentId: s.id,
                admissionNo: s.admissionNo,
                firstName: s.firstName,
                lastName: s.lastName,
                present,
                absent,
                halfDay,
                totalDays,
                percentage,
                belowThreshold: percentage < 75,
            };
        });
        return res.status(200).json({ success: true, data: report });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error generating report' });
    }
};
exports.getAttendanceReport = getAttendanceReport;
// ── Mark Staff Attendance (bulk) ──
const markStaffAttendance = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const { date, records } = staffAttendanceSchema.parse(req.body);
        const results = [];
        for (const rec of records) {
            const result = await prisma_1.default.staffAttendance.upsert({
                where: { staffId_date: { staffId: rec.staffId, date } },
                update: { status: rec.status, checkIn: rec.checkIn, checkOut: rec.checkOut, remarks: rec.remarks },
                create: {
                    staffId: rec.staffId,
                    date,
                    status: rec.status,
                    checkIn: rec.checkIn,
                    checkOut: rec.checkOut,
                    remarks: rec.remarks,
                },
            });
            results.push(result);
        }
        return res.status(200).json({ success: true, message: `Marked attendance for ${results.length} staff`, data: results });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: error.errors[0].message });
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error marking staff attendance' });
    }
};
exports.markStaffAttendance = markStaffAttendance;
// ── Get Staff Attendance for a date ──
const getStaffAttendance = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const { date } = req.query;
        if (!date)
            return res.status(400).json({ success: false, message: 'date required' });
        const staff = await prisma_1.default.staffProfile.findMany({
            where: { user: { schoolId: req.user.schoolId } },
            include: { user: { select: { role: true } } },
            orderBy: { firstName: 'asc' },
        });
        const attendance = await prisma_1.default.staffAttendance.findMany({
            where: { date: date, staffId: { in: staff.map(s => s.id) } },
        });
        const attendanceMap = new Map(attendance.map(a => [a.staffId, a]));
        const result = staff.map(s => ({
            staffId: s.id,
            employeeCode: s.employeeCode,
            firstName: s.firstName,
            lastName: s.lastName,
            role: s.user.role,
            status: attendanceMap.get(s.id)?.status || null,
            checkIn: attendanceMap.get(s.id)?.checkIn || '',
            checkOut: attendanceMap.get(s.id)?.checkOut || '',
        }));
        return res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching staff attendance' });
    }
};
exports.getStaffAttendance = getStaffAttendance;
