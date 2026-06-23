import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');
const money = z.coerce.number().min(0);

const staffDetailsSchema = z.object({
  joiningDate: dateSchema.optional(),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
  ifscCode: z.string().optional(),
  panNumber: z.string().optional(),
  uanNumber: z.string().optional(),
  esiNumber: z.string().optional(),
});

const salarySchema = z.object({
  staffId: z.string().min(1),
  basic: money,
  hra: money.default(0),
  da: money.default(0),
  ta: money.default(0),
  specialAllowance: money.default(0),
  pfEnabled: z.boolean().default(true),
  pfRate: z.coerce.number().min(0).max(100).default(12),
  esiEnabled: z.boolean().default(false),
  esiRate: z.coerce.number().min(0).max(100).default(0.75),
  tds: money.default(0),
  effectiveFrom: dateSchema,
});

const leaveSchema = z.object({
  staffId: z.string().min(1),
  leaveType: z.enum(['CASUAL', 'SICK', 'EARNED', 'UNPAID']),
  fromDate: dateSchema,
  toDate: dateSchema,
  days: z.coerce.number().positive(),
  reason: z.string().optional(),
});

const leaveStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  remarks: z.string().optional(),
});

const payrollSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  workingDays: z.coerce.number().positive(),
});

const round = (value: number) => Math.round(value * 100) / 100;

const monthRange = (month: number, year: number) => {
  const first = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0);
  const last = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
  return { first, last };
};

const overlapDays = (fromDate: string, toDate: string, first: string, last: string) => {
  const from = new Date(`${fromDate > first ? fromDate : first}T00:00:00`);
  const to = new Date(`${toDate < last ? toDate : last}T00:00:00`);
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 86400000) + 1);
};

const assertStaff = async (staffId: string, schoolId: string) =>
  prisma.staffProfile.findFirst({ where: { id: staffId, user: { schoolId } } });

export const updateStaffDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const data = staffDetailsSchema.parse(req.body);
    const staff = await assertStaff(req.params.staffId, req.user.schoolId);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found' });

    const updated = await prisma.staffProfile.update({ where: { id: staff.id }, data });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: error.errors[0].message });
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error updating staff details' });
  }
};

export const createSalaryStructure = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const data = salarySchema.parse(req.body);
    const staff = await assertStaff(data.staffId, req.user.schoolId);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found' });

    const salary = await prisma.salaryStructure.create({ data });
    return res.status(201).json({ success: true, data: salary });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: error.errors[0].message });
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error saving salary structure' });
  }
};

export const getSalaryStructures = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const salaries = await prisma.salaryStructure.findMany({
      where: { staff: { user: { schoolId: req.user.schoolId } } },
      include: { staff: true },
      orderBy: [{ effectiveFrom: 'desc' }, { createdAt: 'desc' }],
    });
    return res.status(200).json({ success: true, data: salaries });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error fetching salary structures' });
  }
};

export const createLeave = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const data = leaveSchema.parse(req.body);
    if (data.toDate < data.fromDate) return res.status(400).json({ success: false, message: 'Leave end date must be after start date' });
    const staff = await assertStaff(data.staffId, req.user.schoolId);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found' });

    const leave = await prisma.staffLeave.create({ data });
    return res.status(201).json({ success: true, data: leave });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: error.errors[0].message });
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error creating leave request' });
  }
};

export const getLeaves = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const leaves = await prisma.staffLeave.findMany({
      where: { staff: { user: { schoolId: req.user.schoolId } } },
      include: { staff: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error fetching leave requests' });
  }
};

export const updateLeaveStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const data = leaveStatusSchema.parse(req.body);
    const leave = await prisma.staffLeave.findFirst({
      where: { id: req.params.leaveId, staff: { user: { schoolId: req.user.schoolId } } },
    });
    if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });

    const updated = await prisma.staffLeave.update({
      where: { id: leave.id },
      data: {
        status: data.status,
        remarks: data.remarks,
        approvedBy: req.user.id,
        approvedDate: new Date().toISOString().slice(0, 10),
      },
    });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: error.errors[0].message });
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error updating leave request' });
  }
};

export const processPayroll = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const data = payrollSchema.parse(req.body);
    const { first, last } = monthRange(data.month, data.year);

    const staff = await prisma.staffProfile.findMany({
      where: { user: { schoolId: req.user.schoolId, status: 'ACTIVE' } },
      include: {
        salaries: { where: { effectiveFrom: { lte: last } }, orderBy: { effectiveFrom: 'desc' }, take: 1 },
        staffAttendance: { where: { date: { gte: first, lte: last } } },
        leaves: { where: { status: 'APPROVED', leaveType: 'UNPAID', fromDate: { lte: last }, toDate: { gte: first } } },
      },
    });

    const payableStaff = staff.filter((member) => member.salaries[0]);
    if (!payableStaff.length) return res.status(400).json({ success: false, message: 'Configure at least one salary structure before processing payroll' });

    const run = await prisma.$transaction(async (tx) => {
      const existing = await tx.payrollRun.findUnique({
        where: { schoolId_month_year: { schoolId: req.user!.schoolId, month: data.month, year: data.year } },
      });
      if (existing) await tx.payrollItem.deleteMany({ where: { payrollRunId: existing.id } });

      const payrollRun = existing
        ? await tx.payrollRun.update({ where: { id: existing.id }, data: { workingDays: data.workingDays, status: 'PROCESSED' } })
        : await tx.payrollRun.create({ data: { schoolId: req.user!.schoolId, month: data.month, year: data.year, workingDays: data.workingDays, status: 'PROCESSED' } });

      let totalGross = 0;
      let totalDeductions = 0;
      let totalNet = 0;

      for (const member of payableStaff) {
        const salary = member.salaries[0];
        const grossSalary = salary.basic + salary.hra + salary.da + salary.ta + salary.specialAllowance;
        const attendanceLop = member.staffAttendance.reduce((days, record) => days + (record.status === 'ABSENT' ? 1 : record.status === 'HALF_DAY' ? 0.5 : 0), 0);
        const leaveLop = member.leaves.reduce((days, leave) => days + overlapDays(leave.fromDate, leave.toDate, first, last), 0);
        const lopDays = Math.min(data.workingDays, attendanceLop + leaveLop);
        const lopDeduction = round((grossSalary / data.workingDays) * lopDays);
        const pfDeduction = salary.pfEnabled ? round((salary.basic * salary.pfRate) / 100) : 0;
        const esiDeduction = salary.esiEnabled ? round((grossSalary * salary.esiRate) / 100) : 0;
        const total = round(lopDeduction + pfDeduction + esiDeduction + salary.tds);
        const netSalary = round(Math.max(0, grossSalary - total));

        await tx.payrollItem.create({
          data: {
            payrollRunId: payrollRun.id,
            staffId: member.id,
            basic: salary.basic,
            hra: salary.hra,
            da: salary.da,
            ta: salary.ta,
            specialAllowance: salary.specialAllowance,
            grossSalary,
            lopDays,
            lopDeduction,
            pfDeduction,
            esiDeduction,
            tdsDeduction: salary.tds,
            totalDeductions: total,
            netSalary,
          },
        });
        totalGross += grossSalary;
        totalDeductions += total;
        totalNet += netSalary;
      }

      return tx.payrollRun.update({
        where: { id: payrollRun.id },
        data: { totalGross: round(totalGross), totalDeductions: round(totalDeductions), totalNet: round(totalNet) },
        include: { items: { include: { staff: true } } },
      });
    });

    return res.status(200).json({ success: true, message: `Payroll processed for ${run.items.length} staff`, data: run });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: error.errors[0].message });
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error processing payroll' });
  }
};

export const getPayrollRuns = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const runs = await prisma.payrollRun.findMany({
      where: { schoolId: req.user.schoolId },
      include: { items: { include: { staff: true }, orderBy: { staff: { firstName: 'asc' } } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    return res.status(200).json({ success: true, data: runs });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error fetching payroll runs' });
  }
};

export const markPayrollPaid = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const run = await prisma.payrollRun.findFirst({ where: { id: req.params.runId, schoolId: req.user.schoolId } });
    if (!run) return res.status(404).json({ success: false, message: 'Payroll run not found' });
    const paidDate = new Date().toISOString().slice(0, 10);
    await prisma.payrollItem.updateMany({ where: { payrollRunId: run.id }, data: { paymentStatus: 'PAID', paidDate } });
    const updated = await prisma.payrollRun.update({
      where: { id: run.id },
      data: { status: 'PAID' },
      include: { items: { include: { staff: true } } },
    });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error marking payroll as paid' });
  }
};

export const exportBankTransfer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const run = await prisma.payrollRun.findFirst({
      where: { id: req.params.runId, schoolId: req.user.schoolId },
      include: { items: { include: { staff: true } } },
    });
    if (!run) return res.status(404).json({ success: false, message: 'Payroll run not found' });

    const escape = (value: string | number | null | undefined) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = [
      ['Employee Code', 'Employee Name', 'Bank Name', 'Account Number', 'IFSC', 'Net Salary'],
      ...run.items.map((item) => [
        item.staff.employeeCode,
        `${item.staff.firstName} ${item.staff.lastName}`,
        item.staff.bankName,
        item.staff.bankAccount,
        item.staff.ifscCode,
        item.netSalary,
      ]),
    ];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="bank-transfer-${run.year}-${String(run.month).padStart(2, '0')}.csv"`);
    return res.status(200).send(rows.map((row) => row.map(escape).join(',')).join('\n'));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error exporting bank transfer file' });
  }
};
