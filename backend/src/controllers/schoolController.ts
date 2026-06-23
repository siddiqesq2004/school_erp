import { Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { AuthenticatedRequest, Role } from '../middlewares/authMiddleware';

// Schemas
const classSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
});

const sectionSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
  name: z.string().min(1, 'Section name is required'),
});

const studentRegisterSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  email: z.string().email().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  admissionNo: z.string().min(2, 'Admission number is required'),
  rollNo: z.string().optional(),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
});

const staffRegisterSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  email: z.string().email().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  employeeCode: z.string().min(2, 'Employee code is required'),
  designation: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum([Role.TEACHER, Role.HOD, Role.STAFF]),
});

// Classes & Sections
export const createClass = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const { name } = classSchema.parse(req.body);

    const existing = await prisma.class.findFirst({
      where: { name, schoolId: req.user.schoolId },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Class already exists' });
    }

    const newClass = await prisma.class.create({
      data: { name, schoolId: req.user.schoolId },
    });

    return res.status(201).json({ success: true, data: newClass });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: error.errors[0].message });
    return res.status(500).json({ success: false, message: 'Error creating class' });
  }
};

export const getClasses = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const classes = await prisma.class.findMany({
      where: { schoolId: req.user.schoolId },
      include: { sections: true },
      orderBy: { name: 'asc' },
    });
    return res.status(200).json({ success: true, data: classes });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching classes' });
  }
};

export const createSection = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const { classId, name } = sectionSchema.parse(req.body);

    // Verify class belongs to the school
    const cls = await prisma.class.findFirst({
      where: { id: classId, schoolId: req.user.schoolId },
    });
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

    const existing = await prisma.section.findFirst({
      where: { name, classId },
    });
    if (existing) return res.status(400).json({ success: false, message: 'Section already exists in this class' });

    const section = await prisma.section.create({
      data: { name, classId },
    });

    return res.status(201).json({ success: true, data: section });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: error.errors[0].message });
    return res.status(500).json({ success: false, message: 'Error creating section' });
  }
};

// Students (SIS)
export const registerStudent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const data = studentRegisterSchema.parse(req.body);

    const existingUser = await prisma.user.findFirst({
      where: { 
        schoolId: req.user.schoolId,
        username: data.username.toLowerCase(),
        role: Role.STUDENT
      },
    });
    if (existingUser) return res.status(400).json({ success: false, message: 'Username is already taken' });

    const existingAdm = await prisma.studentProfile.findUnique({
      where: { admissionNo: data.admissionNo },
    });
    if (existingAdm) return res.status(400).json({ success: false, message: 'Admission number already exists' });

    // Validate Class and Section
    if (data.classId) {
      const cls = await prisma.class.findFirst({
        where: { id: data.classId, schoolId: req.user.schoolId },
      });
      if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    }
    if (data.sectionId) {
      const sec = await prisma.section.findFirst({
        where: { id: data.sectionId, classId: data.classId },
      });
      if (!sec) return res.status(404).json({ success: false, message: 'Section not found' });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          schoolId: req.user!.schoolId,
          username: data.username.toLowerCase(),
          password: hashedPassword,
          email: data.email,
          role: Role.STUDENT,
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
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: error.errors[0].message });
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error registering student' });
  }
};

export const getStudents = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });

    const students = await prisma.studentProfile.findMany({
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
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error fetching students' });
  }
};

// Staff (HR)
export const registerStaff = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const data = staffRegisterSchema.parse(req.body);

    const existingUser = await prisma.user.findFirst({
      where: { 
        schoolId: req.user.schoolId,
        username: data.username.toLowerCase(),
        role: data.role
      },
    });
    if (existingUser) return res.status(400).json({ success: false, message: 'Username is already taken' });

    const existingCode = await prisma.staffProfile.findUnique({
      where: { employeeCode: data.employeeCode },
    });
    if (existingCode) return res.status(400).json({ success: false, message: 'Employee code already exists' });

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          schoolId: req.user!.schoolId,
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
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: error.errors[0].message });
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error registering staff' });
  }
};

export const getStaff = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });

    const staff = await prisma.staffProfile.findMany({
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
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error fetching staff' });
  }
};
