"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResultAnalysis = exports.saveMarks = exports.getMarksEntry = exports.createExamSubject = exports.getExams = exports.createExam = void 0;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../utils/prisma"));
const examSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Exam name is required'),
    type: zod_1.z.string().min(1, 'Exam type is required'),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    status: zod_1.z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});
const examSubjectSchema = zod_1.z.object({
    examId: zod_1.z.string().min(1),
    classId: zod_1.z.string().min(1),
    subjectName: zod_1.z.string().min(1, 'Subject name is required'),
    maxMarks: zod_1.z.coerce.number().positive().default(100),
    passMarks: zod_1.z.coerce.number().nonnegative().default(35),
    examDate: zod_1.z.string().optional(),
});
const marksSchema = zod_1.z.object({
    examSubjectId: zod_1.z.string().min(1),
    records: zod_1.z.array(zod_1.z.object({
        studentId: zod_1.z.string().min(1),
        marksObtained: zod_1.z.coerce.number().optional().nullable(),
        isAbsent: zod_1.z.boolean().default(false),
        remarks: zod_1.z.string().optional(),
    })),
});
const gradeFromPercentage = (percentage) => {
    if (percentage >= 91)
        return 'A1';
    if (percentage >= 81)
        return 'A2';
    if (percentage >= 71)
        return 'B1';
    if (percentage >= 61)
        return 'B2';
    if (percentage >= 51)
        return 'C1';
    if (percentage >= 41)
        return 'C2';
    if (percentage >= 35)
        return 'D';
    return 'E';
};
const createExam = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = examSchema.parse(req.body);
        const exam = await prisma_1.default.exam.create({
            data: {
                schoolId: req.user.schoolId,
                name: data.name,
                type: data.type,
                startDate: data.startDate,
                endDate: data.endDate,
                status: data.status || 'SCHEDULED',
            },
            include: { subjects: { include: { class: true } } },
        });
        return res.status(201).json({ success: true, data: exam });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: error.errors[0].message });
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error creating exam' });
    }
};
exports.createExam = createExam;
const getExams = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const exams = await prisma_1.default.exam.findMany({
            where: { schoolId: req.user.schoolId },
            include: {
                subjects: {
                    include: {
                        class: true,
                        marks: true,
                    },
                    orderBy: { subjectName: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json({ success: true, data: exams });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching exams' });
    }
};
exports.getExams = getExams;
const createExamSubject = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = examSubjectSchema.parse(req.body);
        const exam = await prisma_1.default.exam.findFirst({ where: { id: data.examId, schoolId: req.user.schoolId } });
        if (!exam)
            return res.status(404).json({ success: false, message: 'Exam not found' });
        const cls = await prisma_1.default.class.findFirst({ where: { id: data.classId, schoolId: req.user.schoolId } });
        if (!cls)
            return res.status(404).json({ success: false, message: 'Class not found' });
        const subject = await prisma_1.default.examSubject.create({
            data: {
                examId: data.examId,
                classId: data.classId,
                subjectName: data.subjectName,
                maxMarks: data.maxMarks,
                passMarks: data.passMarks,
                examDate: data.examDate,
            },
            include: { class: true },
        });
        return res.status(201).json({ success: true, data: subject });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: error.errors[0].message });
        if (error?.code === 'P2002')
            return res.status(400).json({ success: false, message: 'Subject already exists for this exam and class' });
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error creating exam subject' });
    }
};
exports.createExamSubject = createExamSubject;
const getMarksEntry = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const { examSubjectId } = req.params;
        const subject = await prisma_1.default.examSubject.findFirst({
            where: { id: examSubjectId, exam: { schoolId: req.user.schoolId } },
            include: { class: true },
        });
        if (!subject)
            return res.status(404).json({ success: false, message: 'Exam subject not found' });
        const students = await prisma_1.default.studentProfile.findMany({
            where: { classId: subject.classId, user: { schoolId: req.user.schoolId } },
            include: { section: true },
            orderBy: [{ rollNo: 'asc' }, { firstName: 'asc' }],
        });
        const marks = await prisma_1.default.mark.findMany({
            where: { examSubjectId, studentId: { in: students.map((student) => student.id) } },
        });
        const marksByStudent = new Map(marks.map((mark) => [mark.studentId, mark]));
        const rows = students.map((student) => ({
            studentId: student.id,
            admissionNo: student.admissionNo,
            rollNo: student.rollNo,
            firstName: student.firstName,
            lastName: student.lastName,
            section: student.section?.name || '',
            marksObtained: marksByStudent.get(student.id)?.marksObtained ?? '',
            isAbsent: marksByStudent.get(student.id)?.isAbsent || false,
            remarks: marksByStudent.get(student.id)?.remarks || '',
            grade: marksByStudent.get(student.id)?.grade || '',
        }));
        return res.status(200).json({ success: true, data: { subject, rows } });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching marks entry grid' });
    }
};
exports.getMarksEntry = getMarksEntry;
const saveMarks = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const { examSubjectId, records } = marksSchema.parse(req.body);
        const subject = await prisma_1.default.examSubject.findFirst({
            where: { id: examSubjectId, exam: { schoolId: req.user.schoolId } },
        });
        if (!subject)
            return res.status(404).json({ success: false, message: 'Exam subject not found' });
        const saved = [];
        for (const record of records) {
            const marksObtained = record.isAbsent ? null : record.marksObtained ?? null;
            if (marksObtained !== null && (marksObtained < 0 || marksObtained > subject.maxMarks)) {
                return res.status(400).json({ success: false, message: `Marks must be between 0 and ${subject.maxMarks}` });
            }
            const percentage = marksObtained === null ? 0 : (marksObtained / subject.maxMarks) * 100;
            const grade = record.isAbsent ? 'AB' : gradeFromPercentage(percentage);
            const mark = await prisma_1.default.mark.upsert({
                where: { examSubjectId_studentId: { examSubjectId, studentId: record.studentId } },
                update: { marksObtained, isAbsent: record.isAbsent, remarks: record.remarks, grade },
                create: { examSubjectId, studentId: record.studentId, marksObtained, isAbsent: record.isAbsent, remarks: record.remarks, grade },
            });
            saved.push(mark);
        }
        return res.status(200).json({ success: true, message: `Saved marks for ${saved.length} students`, data: saved });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: error.errors[0].message });
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error saving marks' });
    }
};
exports.saveMarks = saveMarks;
const getResultAnalysis = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const { examId, classId } = req.query;
        if (!examId)
            return res.status(400).json({ success: false, message: 'examId is required' });
        const exam = await prisma_1.default.exam.findFirst({
            where: { id: examId, schoolId: req.user.schoolId },
            include: {
                subjects: {
                    where: classId ? { classId: classId } : undefined,
                    include: { class: true, marks: { include: { student: true } } },
                },
            },
        });
        if (!exam)
            return res.status(404).json({ success: false, message: 'Exam not found' });
        const subjectAnalysis = exam.subjects.map((subject) => {
            const entered = subject.marks.length;
            const pass = subject.marks.filter((mark) => !mark.isAbsent && (mark.marksObtained || 0) >= subject.passMarks).length;
            const absent = subject.marks.filter((mark) => mark.isAbsent).length;
            const average = entered > 0
                ? Math.round((subject.marks.reduce((sum, mark) => sum + (mark.marksObtained || 0), 0) / entered) * 10) / 10
                : 0;
            return {
                subjectId: subject.id,
                subjectName: subject.subjectName,
                className: subject.class.name,
                maxMarks: subject.maxMarks,
                passMarks: subject.passMarks,
                entered,
                pass,
                fail: entered - pass - absent,
                absent,
                average,
                passPercentage: entered > 0 ? Math.round((pass / entered) * 100) : 0,
            };
        });
        return res.status(200).json({ success: true, data: { exam, subjectAnalysis } });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error generating result analysis' });
    }
};
exports.getResultAnalysis = getResultAnalysis;
