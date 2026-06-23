// Backup copy of original phase9Controller
import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

// Schemas
const udiseSchema = z.object({
  year: z.number().int(),
  udiseCode: z.string(),
  totalStudents: z.number().int().min(0),
  totalTeachers: z.number().int().min(0),
  facilities: z.string().optional(),
});

const boardSchema = z.object({
  boardName: z.string(),
  registrationNo: z.string(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
});

const reportSchema = z.object({
  reportType: z.string(),
  period: z.string(),
  data: z.string(),
});

const admissionSchema = z.object({
  studentName: z.string(),
  dob: z.string(),
  classApplied: z.string(),
  guardianName: z.string().optional(),
});

// UDISE
export const createUDISE = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const data = udiseSchema.parse(req.body);
    const record = await prisma.uDISERecord.create({
      data: { ...data, schoolId: req.user.schoolId },
    });
    return res.status(201).json({ success: true, data: record });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, message: err.errors[0].message });
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error creating UDISE record' });
  }
};

export const listUDISE = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const records = await prisma.uDISERecord.findMany({ where: { schoolId: req.user.schoolId }, orderBy: { year: 'desc' } });
    return res.status(200).json({ success: true, data: records });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error fetching UDISE records' });
  }
};

// Board registrations
export const createBoard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const data = boardSchema.parse(req.body);
    const br = await prisma.boardRegistration.create({ data: { ...data, schoolId: req.user.schoolId } });
    return res.status(201).json({ success: true, data: br });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, message: err.errors[0].message });
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error creating board registration' });
  }
};

export const listBoards = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const list = await prisma.boardRegistration.findMany({ where: { schoolId: req.user.schoolId } });
    return res.status(200).json({ success: true, data: list });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error fetching board registrations' });
  }
};

// Government reports
export const submitReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const data = reportSchema.parse(req.body);
    const rep = await prisma.governmentReport.create({ data: { ...data, schoolId: req.user.schoolId } });
    return res.status(201).json({ success: true, data: rep });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, message: err.errors[0].message });
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error submitting report' });
  }
};

export const listReports = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const list = await prisma.governmentReport.findMany({ where: { schoolId: req.user.schoolId }, orderBy: { createdAt: 'desc' } });
    return res.status(200).json({ success: true, data: list });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error fetching reports' });
  }
};

// Admissions
export const createAdmission = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const data = admissionSchema.parse(req.body);
    const admission = await prisma.admission.create({ data: { ...data, schoolId: req.user.schoolId } });
    return res.status(201).json({ success: true, data: admission });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, message: err.errors[0].message });
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error creating admission' });
  }
};

export const listAdmissions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const list = await prisma.admission.findMany({ where: { schoolId: req.user.schoolId }, orderBy: { appliedAt: 'desc' } });
    return res.status(200).json({ success: true, data: list });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error fetching admissions' });
  }
};

export const updateAdmissionStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const { id } = req.params;
    const { status } = req.body;
    if (!['PENDING', 'ACCEPTED', 'REJECTED'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    const updated = await prisma.admission.updateMany({ where: { id, schoolId: req.user.schoolId }, data: { status, processedAt: new Date().toISOString().slice(0, 10) } });
    if (updated.count === 0) return res.status(404).json({ success: false, message: 'Admission not found' });
    return res.status(200).json({ success: true, message: 'Admission updated' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error updating admission' });
  }
};

// Minimal summary endpoint for Phase 9
export const phase9Summary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const schoolId = req.user.schoolId;
    const [udiseCount, boardCount, pendingAdmissions] = await Promise.all([
      prisma.uDISERecord.count({ where: { schoolId } }),
      prisma.boardRegistration.count({ where: { schoolId } }),
      prisma.admission.count({ where: { schoolId, status: 'PENDING' } }),
    ]);
    return res.status(200).json({ success: true, data: { udiseCount, boardCount, pendingAdmissions } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error fetching summary' });
  }
};

export default {};
