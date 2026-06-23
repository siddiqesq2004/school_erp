"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStaff = exports.registerStaff = exports.getStudents = exports.registerStudent = exports.createSection = exports.getClasses = exports.createClass = void 0;
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
// Schemas
const classSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Class name is required'),
});
const sectionSchema = zod_1.z.object({
    classId: zod_1.z.string().min(1, 'Class ID is required'),
    name: zod_1.z.string().min(1, 'Section name is required'),
});
const studentRegisterSchema = zod_1.z.object({
    username: zod_1.z.string().min(3, 'Username must be at least 3 characters'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    email: zod_1.z.string().email().optional(),
    firstName: zod_1.z.string().min(1, 'First name is required'),
    lastName: zod_1.z.string().min(1, 'Last name is required'),
    admissionNo: zod_1.z.string().min(2, 'Admission number is required'),
    rollNo: zod_1.z.string().optional(),
    dateOfBirth: zod_1.z.string().min(1, 'Date of birth is required'),
    gender: zod_1.z.string().min(1, 'Gender is required'),
    bloodGroup: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    guardianName: zod_1.z.string().optional(),
    guardianPhone: zod_1.z.string().optional(),
    classId: zod_1.z.string().optional(),
    sectionId: zod_1.z.string().optional(),
});
const staffRegisterSchema = zod_1.z.object({
    username: zod_1.z.string().min(3, 'Username must be at least 3 characters'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    email: zod_1.z.string().email().optional(),
    firstName: zod_1.z.string().min(1, 'First name is required'),
    lastName: zod_1.z.string().min(1, 'Last name is required'),
    employeeCode: zod_1.z.string().min(2, 'Employee code is required'),
    designation: zod_1.z.string().optional(),
    department: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    role: zod_1.z.enum([authMiddleware_1.Role.TEACHER, authMiddleware_1.Role.HOD, authMiddleware_1.Role.STAFF]),
});
// Classes & Sections
const createClass = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const { name } = classSchema.parse(req.body);
        const existing = await prisma_1.default.class.findFirst({
            where: { name, schoolId: req.user.schoolId },
        });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Class already exists' });
        }
        const newClass = await prisma_1.default.class.create({
            data: { name, schoolId: req.user.schoolId },
        });
        return res.status(201).json({ success: true, data: newClass });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: error.errors[0].message });
        return res.status(500).json({ success: false, message: 'Error creating class' });
    }
};
exports.createClass = createClass;
const getClasses = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const classes = await prisma_1.default.class.findMany({
            where: { schoolId: req.user.schoolId },
            include: { sections: true },
            orderBy: { name: 'asc' },
        });
        return res.status(200).json({ success: true, data: classes });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching classes' });
    }
};
exports.getClasses = getClasses;
const createSection = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const { classId, name } = sectionSchema.parse(req.body);
        // Verify class belongs to the school
        const cls = await prisma_1.default.class.findFirst({
            where: { id: classId, schoolId: req.user.schoolId },
        });
        if (!cls)
            return res.status(404).json({ success: false, message: 'Class not found' });
        const existing = await prisma_1.default.section.findFirst({
            where: { name, classId },
        });
        if (existing)
            return res.status(400).json({ success: false, message: 'Section already exists in this class' });
        const section = await prisma_1.default.section.create({
            data: { name, classId },
        });
        return res.status(201).json({ success: true, data: section });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: error.errors[0].message });
        return res.status(500).json({ success: false, message: 'Error creating section' });
    }
};
exports.createSection = createSection;
// Students (SIS)
const registerStudent = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = studentRegisterSchema.parse(req.body);
        const existingUser = await prisma_1.default.user.findUnique({
            where: { username: data.username.toLowerCase() },
        });
        if (existingUser)
            return res.status(400).json({ success: false, message: 'Username is already taken' });
        const existingAdm = await prisma_1.default.studentProfile.findUnique({
            where: { admissionNo: data.admissionNo },
        });
        if (existingAdm)
            return res.status(400).json({ success: false, message: 'Admission number already exists' });
        // Validate Class and Section
        if (data.classId) {
            const cls = await prisma_1.default.class.findFirst({
                where: { id: data.classId, schoolId: req.user.schoolId },
            });
            if (!cls)
                return res.status(404).json({ success: false, message: 'Class not found' });
        }
        if (data.sectionId) {
            const sec = await prisma_1.default.section.findFirst({
                where: { id: data.sectionId, classId: data.classId },
            });
            if (!sec)
                return res.status(404).json({ success: false, message: 'Section not found' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
        const result = await prisma_1.default.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    schoolId: req.user.schoolId,
                    username: data.username.toLowerCase(),
                    password: hashedPassword,
                    email: data.email,
                    role: authMiddleware_1.Role.STUDENT,
                },
            });
            const profile = await tx.studentProfile.create({
                data: {
                    userId: user.id,
                    admissionNo: data.admissionNo,
                    rollNo: data.rollNo,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    dateOfBirth: data.dateOfBirth,
                    gender: data.gender,
                    bloodGroup: data.bloodGroup,
                    address: data.address,
                    guardianName: data.guardianName,
                    guardianPhone: data.guardianPhone,
                    classId: data.classId,
                    sectionId: data.sectionId,
                },
            });
            return { user, profile };
        });
        return res.status(201).json({ success: true, data: result });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: error.errors[0].message });
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error registering student' });
    }
};
exports.registerStudent = registerStudent;
const getStudents = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const students = await prisma_1.default.studentProfile.findMany({
            where: {
                user: { schoolId: req.user.schoolId },
            },
            include: {
                user: {
                    select: { username: true, email: true, status: true },
                },
                class: true,
                section: true,
            },
            orderBy: { firstName: 'asc' },
        });
        return res.status(200).json({ success: true, data: students });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching students' });
    }
};
exports.getStudents = getStudents;
// Staff (HR)
const registerStaff = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = staffRegisterSchema.parse(req.body);
        const existingUser = await prisma_1.default.user.findUnique({
            where: { username: data.username.toLowerCase() },
        });
        if (existingUser)
            return res.status(400).json({ success: false, message: 'Username is already taken' });
        const existingCode = await prisma_1.default.staffProfile.findUnique({
            where: { employeeCode: data.employeeCode },
        });
        if (existingCode)
            return res.status(400).json({ success: false, message: 'Employee code already exists' });
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
        const result = await prisma_1.default.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    schoolId: req.user.schoolId,
                    username: data.username.toLowerCase(),
                    password: hashedPassword,
                    email: data.email,
                    role: data.role,
                },
            });
            const profile = await tx.staffProfile.create({
                data: {
                    userId: user.id,
                    employeeCode: data.employeeCode,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    designation: data.designation,
                    department: data.department,
                    phone: data.phone,
                },
            });
            return { user, profile };
        });
        return res.status(201).json({ success: true, data: result });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: error.errors[0].message });
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error registering staff' });
    }
};
exports.registerStaff = registerStaff;
const getStaff = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const staff = await prisma_1.default.staffProfile.findMany({
            where: {
                user: { schoolId: req.user.schoolId },
            },
            include: {
                user: {
                    select: { username: true, email: true, role: true, status: true },
                },
            },
            orderBy: { firstName: 'asc' },
        });
        return res.status(200).json({ success: true, data: staff });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching staff' });
    }
};
exports.getStaff = getStaff;
