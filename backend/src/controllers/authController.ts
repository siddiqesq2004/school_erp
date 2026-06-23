import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthenticatedRequest, Role } from '../middlewares/authMiddleware';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-12345';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const signToken = (id: string) =>
  jwt.sign({ id }, JWT_SECRET as jwt.Secret, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);

// Validation Schemas
const registerSchoolSchema = z.object({
  schoolName: z.string().min(3, 'School name must be at least 3 characters'),
  schoolCode: z.string().min(3, 'School code must be at least 3 characters'),
  themeColor: z.string().optional(),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  email: z.string().email('Invalid email address').optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

const loginSchema = z.object({
  schoolCode: z.string().min(1, 'School code is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchool = async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchoolSchema.parse(req.body);

    // Check if school code is already taken
    const existingSchool = await prisma.school.findUnique({
      where: { code: validatedData.schoolCode.toUpperCase() },
    });

    if (existingSchool) {
      return res.status(400).json({
        success: false,
        message: 'A school with this code already exists',
      });
    }

    // No need to check global username uniqueness anymore because
    // the username will be unique to the newly created school.

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Transaction to create school, admin user, and staff profile
    const result = await prisma.$transaction(async (tx) => {
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
          role: Role.ADMIN,
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
  } catch (error) {
    if (error instanceof z.ZodError) {
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

export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const school = await prisma.school.findUnique({
      where: { code: validatedData.schoolCode.toUpperCase() },
    });

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'No school found with this school code',
      });
    }

    const users = await prisma.user.findMany({
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

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    let validUser = null;
    for (const u of users) {
      if (u.status !== 'ACTIVE') continue;
      const isMatch = await bcrypt.compare(validatedData.password, u.password);
      if (isMatch) {
        validUser = u;
        break;
      }
    }

    if (!validUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    // Sign JWT
    const token = signToken(validUser.id);

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
          logoUrl: school.logoUrl,
        },
        user: {
          id: validUser.id,
          username: validUser.username,
          role: validUser.role,
          email: validUser.email,
          profile: validUser.studentProfile || validUser.staffProfile,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
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

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const user = await prisma.user.findUnique({
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
          profile: user.role === Role.STUDENT ? user.studentProfile : user.staffProfile,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error fetching profile',
    });
  }
};

export const getSchoolByCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const school = await prisma.school.findUnique({
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
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching school metadata',
    });
  }
};

export const createPortalUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== Role.ADMIN) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { username, password, role, email, studentId } = req.body;

    if (!username || !password || !role || !studentId) {
      return res.status(400).json({ success: false, message: 'Missing required fields, including studentId' });
    }

    const existingUser = await prisma.user.findFirst({
      where: { 
        schoolId: req.user.schoolId,
        username: username.toLowerCase(),
        role: role
      },
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { id: studentId }
    });

    if (!studentProfile) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          schoolId: req.user!.schoolId,
          username: username.toLowerCase(),
          password: hashedPassword,
          email,
          role,
        },
      });

      if (role === Role.STUDENT) {
        await tx.studentProfile.update({
          where: { id: studentId },
          data: { userId: newUser.id }
        });
      } else if (role === Role.PARENT) {
        await tx.parentProfile.create({
          data: {
            userId: newUser.id,
            studentId: studentId,
            name: username, // Fallback name
            relation: 'Parent', // Default relation
          }
        });
      }
      return newUser;
    });

    return res.status(201).json({
      success: true,
      message: `${role} account created successfully`,
      data: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to create user' });
  }
};

export const getPortalUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== Role.ADMIN) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const users = await prisma.user.findMany({
      where: {
        schoolId: req.user.schoolId,
        role: { in: [Role.STUDENT, Role.PARENT] }
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

export const deletePortalUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== Role.ADMIN) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.schoolId !== req.user.schoolId || (user.role !== Role.STUDENT && user.role !== Role.PARENT)) {
      return res.status(404).json({ success: false, message: 'Portal user not found or forbidden' });
    }

    await prisma.user.delete({ where: { id } });

    return res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};
