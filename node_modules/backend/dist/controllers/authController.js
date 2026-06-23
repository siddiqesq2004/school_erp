"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSchoolByCode = exports.getMe = exports.login = exports.registerSchool = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../utils/prisma"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-12345';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const signToken = (id) => jsonwebtoken_1.default.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
});
// Validation Schemas
const registerSchoolSchema = zod_1.z.object({
    schoolName: zod_1.z.string().min(3, 'School name must be at least 3 characters'),
    schoolCode: zod_1.z.string().min(3, 'School code must be at least 3 characters'),
    themeColor: zod_1.z.string().optional(),
    username: zod_1.z.string().min(3, 'Username must be at least 3 characters'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    email: zod_1.z.string().email('Invalid email address').optional(),
    firstName: zod_1.z.string().min(1, 'First name is required'),
    lastName: zod_1.z.string().min(1, 'Last name is required'),
});
const loginSchema = zod_1.z.object({
    schoolCode: zod_1.z.string().min(1, 'School code is required'),
    username: zod_1.z.string().min(1, 'Username is required'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
const registerSchool = async (req, res) => {
    try {
        const validatedData = registerSchoolSchema.parse(req.body);
        // Check if school code is already taken
        const existingSchool = await prisma_1.default.school.findUnique({
            where: { code: validatedData.schoolCode.toUpperCase() },
        });
        if (existingSchool) {
            return res.status(400).json({
                success: false,
                message: 'A school with this code already exists',
            });
        }
        // Check if username is already taken globally
        const existingUser = await prisma_1.default.user.findUnique({
            where: { username: validatedData.username.toLowerCase() },
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'This username is already taken',
            });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(validatedData.password, 10);
        // Transaction to create school, admin user, and staff profile
        const result = await prisma_1.default.$transaction(async (tx) => {
            const school = await tx.school.create({
                data: {
                    name: validatedData.schoolName,
                    code: validatedData.schoolCode.toUpperCase(),
                    themeColor: validatedData.themeColor || '#3b82f6',
                },
            });
            const user = await tx.user.create({
                data: {
                    schoolId: school.id,
                    username: validatedData.username.toLowerCase(),
                    password: hashedPassword,
                    email: validatedData.email,
                    role: authMiddleware_1.Role.ADMIN,
                },
            });
            const staffProfile = await tx.staffProfile.create({
                data: {
                    userId: user.id,
                    employeeCode: `EMP-${school.code}-ADMIN`,
                    firstName: validatedData.firstName,
                    lastName: validatedData.lastName,
                    designation: 'Administrator',
                    department: 'Management',
                },
            });
            return { school, user, staffProfile };
        });
        // Sign JWT
        const token = signToken(result.user.id);
        return res.status(201).json({
            success: true,
            message: 'School registered successfully',
            data: {
                token,
                school: {
                    id: result.school.id,
                    name: result.school.name,
                    code: result.school.code,
                    themeColor: result.school.themeColor,
                },
                user: {
                    id: result.user.id,
                    username: result.user.username,
                    role: result.user.role,
                    email: result.user.email,
                    profile: result.staffProfile,
                },
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                message: error.errors[0].message,
            });
        }
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during registration',
        });
    }
};
exports.registerSchool = registerSchool;
const login = async (req, res) => {
    try {
        const validatedData = loginSchema.parse(req.body);
        const school = await prisma_1.default.school.findUnique({
            where: { code: validatedData.schoolCode.toUpperCase() },
        });
        if (!school) {
            return res.status(404).json({
                success: false,
                message: 'No school found with this school code',
            });
        }
        const user = await prisma_1.default.user.findFirst({
            where: {
                username: validatedData.username.toLowerCase(),
                schoolId: school.id,
            },
            include: {
                studentProfile: {
                    include: {
                        class: true,
                        section: true,
                    },
                },
                staffProfile: true,
            },
        });
        if (!user || user.status !== 'ACTIVE') {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password',
            });
        }
        const isMatch = await bcryptjs_1.default.compare(validatedData.password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password',
            });
        }
        // Sign JWT
        const token = signToken(user.id);
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                school: {
                    id: school.id,
                    name: school.name,
                    code: school.code,
                    themeColor: school.themeColor,
                },
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    email: user.email,
                    profile: user.role === authMiddleware_1.Role.STUDENT ? user.studentProfile : user.staffProfile,
                },
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                message: error.errors[0].message,
            });
        }
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during login',
        });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated',
            });
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.id },
            include: {
                school: true,
                studentProfile: {
                    include: {
                        class: true,
                        section: true,
                    },
                },
                staffProfile: true,
            },
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        return res.status(200).json({
            success: true,
            data: {
                school: {
                    id: user.school.id,
                    name: user.school.name,
                    code: user.school.code,
                    themeColor: user.school.themeColor,
                },
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    email: user.email,
                    profile: user.role === authMiddleware_1.Role.STUDENT ? user.studentProfile : user.staffProfile,
                },
            },
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error fetching profile',
        });
    }
};
exports.getMe = getMe;
const getSchoolByCode = async (req, res) => {
    try {
        const { code } = req.params;
        const school = await prisma_1.default.school.findUnique({
            where: { code: code.toUpperCase() },
            select: {
                id: true,
                name: true,
                code: true,
                themeColor: true,
                logoUrl: true,
            },
        });
        if (!school) {
            return res.status(404).json({
                success: false,
                message: 'School not found',
            });
        }
        return res.status(200).json({
            success: true,
            data: school,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching school metadata',
        });
    }
};
exports.getSchoolByCode = getSchoolByCode;
