import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

// Schemas
const courseSchema = z.object({ title: z.string().min(3), description: z.string().optional(), classId: z.string().uuid().optional() });
const lessonSchema = z.object({ courseId: z.string().uuid(), title: z.string().min(3), videoUrl: z.string().url(), duration: z.number().int().optional() });
const quizSchema = z.object({ courseId: z.string().uuid(), title: z.string().min(3) });
const quizQuestionSchema = z.object({ quizId: z.string().uuid(), question: z.string().min(3), options: z.array(z.string()).min(2), answer: z.string().min(1) });

const hostelSchema = z.object({ name: z.string().min(2), address: z.string().optional() });
const hostelRoomSchema = z.object({ hostelId: z.string().uuid(), roomNo: z.string().min(1), capacity: z.number().int().min(1) });
const hostelAllocateSchema = z.object({ roomId: z.string().uuid(), studentId: z.string().uuid(), fromDate: z.string(), toDate: z.string().optional() });

const menuItemSchema = z.object({ name: z.string().min(1), price: z.number().positive(), category: z.string().optional(), available: z.boolean().optional() });
const canteenOrderSchema = z.object({ studentId: z.string().uuid().optional(), items: z.array(z.object({ itemId: z.string().uuid(), qty: z.number().int().min(1) })).min(1) });

const sportSchema = z.object({ name: z.string().min(2) });
const teamSchema = z.object({ sportId: z.string().uuid(), name: z.string().min(2), members: z.array(z.string().uuid()).optional() });
const matchSchema = z.object({ sportId: z.string().uuid(), teamAId: z.string().uuid(), teamBId: z.string().uuid(), date: z.string() });

const healthRecordSchema = z.object({ studentId: z.string().uuid(), allergies: z.string().optional(), medicalNotes: z.string().optional() });
const medicalVisitSchema = z.object({ studentId: z.string().uuid(), visitDate: z.string(), diagnosis: z.string().optional(), prescription: z.string().optional(), notes: z.string().optional() });

// Helpers
const requireAuth = (req: AuthenticatedRequest) => { if (!req.user) throw { status: 401, message: 'Unauthenticated' }; return req.user.schoolId; };

// LMS — Courses
export const createCourse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = requireAuth(req);
    const data = courseSchema.parse(req.body);
    const course = await prisma.course.create({ data: { ...data, schoolId } });
    return res.status(201).json({ success: true, data: course });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, message: err.errors[0].message });
    return res.status(err.status || 500).json({ success: false, message: err.message || 'Error creating course' });
  }
};

export const listCourses = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = requireAuth(req);
    const courses = await prisma.course.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } });
    return res.status(200).json({ success: true, data: courses });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error listing courses' });
  }
};

export const createVideoLesson = async (req: AuthenticatedRequest, res: Response) => {
  try {
    requireAuth(req);
    const data = lessonSchema.parse(req.body);
    // ensure course exists and belongs to school
    const course = await prisma.course.findUnique({ where: { id: data.courseId } });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    const lesson = await prisma.videoLesson.create({ data });
    return res.status(201).json({ success: true, data: lesson });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, message: err.errors[0].message });
    return res.status(500).json({ success: false, message: 'Error creating lesson' });
  }
};

export const listVideoLessons = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = requireAuth(req);
    const { courseId } = req.query;
    const where: any = courseId
      ? { courseId: String(courseId), course: { schoolId } }
      : { course: { schoolId } };
    const lessons = await prisma.videoLesson.findMany({
      where,
      include: { course: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ success: true, data: lessons });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error listing lessons' });
  }
};

// Quiz
export const createQuiz = async (req: AuthenticatedRequest, res: Response) => {
  try {
    requireAuth(req);
    const data = quizSchema.parse(req.body);
    const quiz = await prisma.quiz.create({ data });
    return res.status(201).json({ success: true, data: quiz });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, message: err.errors[0].message });
    return res.status(500).json({ success: false, message: 'Error creating quiz' });
  }
};

export const createQuizQuestion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    requireAuth(req);
    const data = quizQuestionSchema.parse(req.body);
    const question = await prisma.quizQuestion.create({ data: { ...data, options: JSON.stringify(data.options) } });
    return res.status(201).json({ success: true, data: question });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, message: err.errors[0].message });
    return res.status(500).json({ success: false, message: 'Error creating question' });
  }
};

export const listQuizzes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = requireAuth(req);
    const quizzes = await prisma.quiz.findMany({
      where: { course: { schoolId } },
      include: { questions: true, course: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ success: true, data: quizzes });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error listing quizzes' });
  }
};

// Hostel
export const createHostel = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = requireAuth(req);
    const data = hostelSchema.parse(req.body);
    const hostel = await prisma.hostel.create({ data: { ...data, schoolId } });
    return res.status(201).json({ success: true, data: hostel });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, message: err.errors[0].message });
    return res.status(500).json({ success: false, message: 'Error creating hostel' });
  }
};

export const listHostels = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = requireAuth(req);
    const hostels = await prisma.hostel.findMany({
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
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error listing hostels' });
  }
};

export const createHostelRoom = async (req: AuthenticatedRequest, res: Response) => {
  try {
    requireAuth(req);
    const data = hostelRoomSchema.parse(req.body);
    const hostel = await prisma.hostel.findUnique({ where: { id: data.hostelId } });
    if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found' });
    const room = await prisma.hostelRoom.create({ data });
    return res.status(201).json({ success: true, data: room });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, message: err.errors[0].message });
    return res.status(500).json({ success: false, message: 'Error creating room' });
  }
};

export const allocateHostel = async (req: AuthenticatedRequest, res: Response) => {
  try {
    requireAuth(req);
    const data = hostelAllocateSchema.parse(req.body);
    const room = await prisma.hostelRoom.findUnique({ where: { id: data.roomId }, include: { allocations: true } });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    const student = await prisma.studentProfile.findUnique({ where: { id: data.studentId } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    const current = room.allocations.length;
    if (current >= room.capacity) return res.status(400).json({ success: false, message: 'Room is full' });
    const alloc = await prisma.hostelAllocation.create({ data });
    return res.status(201).json({ success: true, data: alloc });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, message: err.errors[0].message });
    return res.status(500).json({ success: false, message: 'Error allocating hostel' });
  }
};

// Canteen
export const createMenuItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = requireAuth(req);
    const data = menuItemSchema.parse(req.body);
    const item = await prisma.menuItem.create({ data: { ...data, schoolId } });
    return res.status(201).json({ success: true, data: item });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, message: err.errors[0].message });
    return res.status(500).json({ success: false, message: 'Error creating menu item' });
  }
};

export const listMenuItems = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = requireAuth(req);
    const items = await prisma.menuItem.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } });
    return res.status(200).json({ success: true, data: items });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error listing menu items' });
  }
};

export const createCanteenOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = requireAuth(req);
    const data = canteenOrderSchema.parse(req.body);
    const itemIds = data.items.map((i) => i.itemId);
    const dbItems = await prisma.menuItem.findMany({ where: { id: { in: itemIds } } });
    const priceMap: Record<string, number> = {};
    dbItems.forEach((it) => (priceMap[it.id] = it.price as number));
    let total = 0;
    for (const it of data.items) {
      const price = priceMap[it.itemId];
      if (price === undefined) return res.status(400).json({ success: false, message: `Menu item ${it.itemId} not found` });
      total += price * it.qty;
    }
    const order = await prisma.canteenOrder.create({ data: { schoolId, studentId: data.studentId, items: JSON.stringify(data.items), total, orderedAt: new Date().toISOString() } });
    return res.status(201).json({ success: true, data: order });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, message: err.errors[0].message });
    return res.status(500).json({ success: false, message: 'Error creating order' });
  }
};

export const listCanteenOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = requireAuth(req);
    const orders = await prisma.canteenOrder.findMany({
      where: { schoolId },
      include: { student: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ success: true, data: orders });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error listing canteen orders' });
  }
};

// Sports
export const createSport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = requireAuth(req);
    const data = sportSchema.parse(req.body);
    const sport = await prisma.sport.create({ data: { ...data, schoolId } });
    return res.status(201).json({ success: true, data: sport });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, message: err.errors[0].message });
    return res.status(500).json({ success: false, message: 'Error creating sport' });
  }
};

export const listSports = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = requireAuth(req);
    const sports = await prisma.sport.findMany({
      where: { schoolId },
      include: { teams: true, matches: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ success: true, data: sports });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error listing sports' });
  }
};

export const createTeam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    requireAuth(req);
    const data = teamSchema.parse(req.body);
    const team = await prisma.team.create({ data: { ...data, members: data.members ? JSON.stringify(data.members) : '[]' } });
    return res.status(201).json({ success: true, data: team });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, message: err.errors[0].message });
    return res.status(500).json({ success: false, message: 'Error creating team' });
  }
};

export const listTeams = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = requireAuth(req);
    const teams = await prisma.team.findMany({
      where: { sport: { schoolId } },
      include: { sport: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ success: true, data: teams });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error listing teams' });
  }
};

export const scheduleMatch = async (req: AuthenticatedRequest, res: Response) => {
  try {
    requireAuth(req);
    const data = matchSchema.parse(req.body);
    const match = await prisma.match.create({ data });
    return res.status(201).json({ success: true, data: match });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, message: err.errors[0].message });
    return res.status(500).json({ success: false, message: 'Error scheduling match' });
  }
};

export const listMatches = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = requireAuth(req);
    const matches = await prisma.match.findMany({
      where: { sport: { schoolId } },
      include: { sport: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ success: true, data: matches });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error listing matches' });
  }
};

// Health
export const createHealthRecord = async (req: AuthenticatedRequest, res: Response) => {
  try {
    requireAuth(req);
    const data = healthRecordSchema.parse(req.body);
    const record = await prisma.healthRecord.create({ data });
    return res.status(201).json({ success: true, data: record });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, message: err.errors[0].message });
    return res.status(500).json({ success: false, message: 'Error creating health record' });
  }
};

export const listHealthRecords = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = requireAuth(req);
    const records = await prisma.healthRecord.findMany({
      where: { student: { user: { schoolId } } },
      include: { student: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ success: true, data: records });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error listing health records' });
  }
};

export const createMedicalVisit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    requireAuth(req);
    const data = medicalVisitSchema.parse(req.body);
    const visit = await prisma.medicalVisit.create({ data });
    return res.status(201).json({ success: true, data: visit });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, message: err.errors[0].message });
    return res.status(500).json({ success: false, message: 'Error creating medical visit' });
  }
};

export const listMedicalVisits = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = requireAuth(req);
    const visits = await prisma.medicalVisit.findMany({
      where: { student: { user: { schoolId } } },
      include: { student: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ success: true, data: visits });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error listing medical visits' });
  }
};

export const deleteMenuItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = requireAuth(req);
    const { id } = req.params;
    await prisma.menuItem.delete({
      where: { id, schoolId }
    });
    return res.status(200).json({ success: true, message: 'Menu item deleted' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error deleting menu item' });
  }
};

export default {};
