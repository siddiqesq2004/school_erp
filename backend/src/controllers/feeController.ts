import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const feeStructureSchema = z.object({
  name: z.string().min(1, 'Fee name is required'),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  frequency: z.enum(['MONTHLY', 'QUARTERLY', 'TERM', 'ANNUAL', 'ONE_TIME']),
  dueDay: z.coerce.number().min(1).max(31).optional(),
  lateFee: z.coerce.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

const assignFeeSchema = z.object({
  feeStructureId: z.string().min(1),
  studentIds: z.array(z.string().min(1)).min(1),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD'),
});

const paymentSchema = z.object({
  feePaymentId: z.string().min(1),
  paidAmount: z.coerce.number().positive('Paid amount must be greater than zero'),
  paidDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  paymentMode: z.enum(['CASH', 'CHEQUE', 'UPI', 'CARD', 'NETBANKING', 'ONLINE']).optional(),
  transactionId: z.string().optional(),
  remarks: z.string().optional(),
});

const receiptNo = () => `RCP-${Date.now().toString(36).toUpperCase()}`;

export const createFeeStructure = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const data = feeStructureSchema.parse(req.body);
    const fee = await prisma.feeStructure.create({
      data: {
        schoolId: req.user.schoolId,
        name: data.name,
        amount: data.amount,
        frequency: data.frequency,
        dueDay: data.dueDay || 10,
        lateFee: data.lateFee || 0,
        isActive: data.isActive ?? true,
      },
    });
    return res.status(201).json({ success: true, data: fee });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: error.errors[0].message });
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error creating fee structure' });
  }
};

export const getFeeStructures = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const fees = await prisma.feeStructure.findMany({
      where: { schoolId: req.user.schoolId },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ success: true, data: fees });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error fetching fee structures' });
  }
};

export const assignFee = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const data = assignFeeSchema.parse(req.body);

    const fee = await prisma.feeStructure.findFirst({
      where: { id: data.feeStructureId, schoolId: req.user.schoolId, isActive: true },
    });
    if (!fee) return res.status(404).json({ success: false, message: 'Active fee structure not found' });

    const students = await prisma.studentProfile.findMany({
      where: { id: { in: data.studentIds }, user: { schoolId: req.user.schoolId } },
    });
    if (students.length !== data.studentIds.length) {
      return res.status(400).json({ success: false, message: 'One or more students are invalid' });
    }

    const created = [];
    for (const studentId of data.studentIds) {
      const payment = await prisma.feePayment.create({
        data: {
          studentId,
          feeStructureId: fee.id,
          amount: fee.amount,
          dueDate: data.dueDate,
          status: 'PENDING',
        },
      });
      created.push(payment);
    }

    return res.status(201).json({ success: true, message: `Assigned fee to ${created.length} students`, data: created });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: error.errors[0].message });
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error assigning fee' });
  }
};

export const getFeePayments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const { studentId, status } = req.query;
    const today = new Date().toISOString().slice(0, 10);

    await prisma.feePayment.updateMany({
      where: {
        status: { in: ['PENDING', 'PARTIAL'] },
        dueDate: { lt: today },
        student: { user: { schoolId: req.user.schoolId } },
      },
      data: { status: 'OVERDUE' },
    });

    const payments = await prisma.feePayment.findMany({
      where: {
        student: { user: { schoolId: req.user.schoolId } },
        ...(studentId ? { studentId: studentId as string } : {}),
        ...(status ? { status: status as string } : {}),
      },
      include: {
        feeStructure: true,
        student: { include: { class: true, section: true } },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });

    return res.status(200).json({ success: true, data: payments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error fetching fee payments' });
  }
};

export const recordPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const data = paymentSchema.parse(req.body);

    const existing = await prisma.feePayment.findFirst({
      where: { id: data.feePaymentId, student: { user: { schoolId: req.user.schoolId } } },
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Fee payment not found' });
    if (existing.status === 'PAID') return res.status(400).json({ success: false, message: 'This fee is already fully paid' });

    const newPaidAmount = existing.paidAmount + data.paidAmount;
    const status = newPaidAmount >= existing.amount ? 'PAID' : 'PARTIAL';

    const payment = await prisma.feePayment.update({
      where: { id: existing.id },
      data: {
        paidAmount: newPaidAmount,
        paidDate: data.paidDate || new Date().toISOString().slice(0, 10),
        paymentMode: data.paymentMode,
        transactionId: data.transactionId,
        receiptNo: existing.receiptNo || receiptNo(),
        remarks: data.remarks,
        status,
      },
      include: {
        feeStructure: true,
        student: { include: { class: true, section: true } },
      },
    });

    return res.status(200).json({ success: true, data: payment });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: error.errors[0].message });
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error recording payment' });
  }
};

export const getFeeSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const payments = await prisma.feePayment.findMany({
      where: { student: { user: { schoolId: req.user.schoolId } } },
      include: { student: true, feeStructure: true },
    });

    const totalDue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const collected = payments.reduce((sum, payment) => sum + payment.paidAmount, 0);
    const outstanding = totalDue - collected;
    const overdue = payments.filter((payment) => payment.status === 'OVERDUE').reduce((sum, payment) => sum + (payment.amount - payment.paidAmount), 0);
    const defaulters = payments.filter((payment) => ['OVERDUE', 'PARTIAL'].includes(payment.status)).length;

    return res.status(200).json({
      success: true,
      data: { totalDue, collected, outstanding, overdue, defaulters, payments: payments.length },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error generating fee summary' });
  }
};
