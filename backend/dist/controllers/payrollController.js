"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportBankTransfer = exports.markPayrollPaid = exports.getPayrollRuns = exports.processPayroll = exports.updateLeaveStatus = exports.getLeaves = exports.createLeave = exports.getSalaryStructures = exports.createSalaryStructure = exports.updateStaffDetails = void 0;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../utils/prisma"));
const dateSchema = zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');
const money = zod_1.z.coerce.number().min(0);
const staffDetailsSchema = zod_1.z.object({
    joiningDate: dateSchema.optional(),
    bankAccount: zod_1.z.string().optional(),
    bankName: zod_1.z.string().optional(),
    ifscCode: zod_1.z.string().optional(),
    panNumber: zod_1.z.string().optional(),
    uanNumber: zod_1.z.string().optional(),
    esiNumber: zod_1.z.string().optional(),
});
const salarySchema = zod_1.z.object({
    staffId: zod_1.z.string().min(1),
    basic: money,
    hra: money.default(0),
    da: money.default(0),
    ta: money.default(0),
    specialAllowance: money.default(0),
    pfEnabled: zod_1.z.boolean().default(true),
    pfRate: zod_1.z.coerce.number().min(0).max(100).default(12),
    esiEnabled: zod_1.z.boolean().default(false),
    esiRate: zod_1.z.coerce.number().min(0).max(100).default(0.75),
    tds: money.default(0),
    effectiveFrom: dateSchema,
});
const leaveSchema = zod_1.z.object({
    staffId: zod_1.z.string().min(1),
    leaveType: zod_1.z.enum(['CASUAL', 'SICK', 'EARNED', 'UNPAID']),
    fromDate: dateSchema,
    toDate: dateSchema,
    days: zod_1.z.coerce.number().positive(),
    reason: zod_1.z.string().optional(),
});
const leaveStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['APPROVED', 'REJECTED']),
    remarks: zod_1.z.string().optional(),
});
const payrollSchema = zod_1.z.object({
    month: zod_1.z.coerce.number().int().min(1).max(12),
    year: zod_1.z.coerce.number().int().min(2000).max(2100),
    workingDays: zod_1.z.coerce.number().positive(),
});
const round = (value) => Math.round(value * 100) / 100;
const monthRange = (month, year) => {
    const first = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0);
    const last = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
    return { first, last };
};
const overlapDays = (fromDate, toDate, first, last) => {
    const from = new Date(`${fromDate > first ? fromDate : first}T00:00:00`);
    const to = new Date(`${toDate < last ? toDate : last}T00:00:00`);
    return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 86400000) + 1);
};
const assertStaff = async (staffId, schoolId) => prisma_1.default.staffProfile.findFirst({ where: { id: staffId, user: { schoolId } } });
const updateStaffDetails = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = staffDetailsSchema.parse(req.body);
        const staff = await assertStaff(req.params.staffId, req.user.schoolId);
        if (!staff)
            return res.status(404).json({ success: false, message: 'Staff member not found' });
        const updated = await prisma_1.default.staffProfile.update({ where: { id: staff.id }, data });
        return res.status(200).json({ success: true, data: updated });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: error.errors[0].message });
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error updating staff details' });
    }
};
exports.updateStaffDetails = updateStaffDetails;
const createSalaryStructure = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = salarySchema.parse(req.body);
        const staff = await assertStaff(data.staffId, req.user.schoolId);
        if (!staff)
            return res.status(404).json({ success: false, message: 'Staff member not found' });
        const salary = await prisma_1.default.salaryStructure.create({ data });
        return res.status(201).json({ success: true, data: salary });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: error.errors[0].message });
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error saving salary structure' });
    }
};
exports.createSalaryStructure = createSalaryStructure;
const getSalaryStructures = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const salaries = await prisma_1.default.salaryStructure.findMany({
            where: { staff: { user: { schoolId: req.user.schoolId } } },
            include: { staff: true },
            orderBy: [{ effectiveFrom: 'desc' }, { createdAt: 'desc' }],
        });
        return res.status(200).json({ success: true, data: salaries });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching salary structures' });
    }
};
exports.getSalaryStructures = getSalaryStructures;
const createLeave = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = leaveSchema.parse(req.body);
        if (data.toDate < data.fromDate)
            return res.status(400).json({ success: false, message: 'Leave end date must be after start date' });
        const staff = await assertStaff(data.staffId, req.user.schoolId);
        if (!staff)
            return res.status(404).json({ success: false, message: 'Staff member not found' });
        const leave = await prisma_1.default.staffLeave.create({ data });
        return res.status(201).json({ success: true, data: leave });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: error.errors[0].message });
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error creating leave request' });
    }
};
exports.createLeave = createLeave;
const getLeaves = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const leaves = await prisma_1.default.staffLeave.findMany({
            where: { staff: { user: { schoolId: req.user.schoolId } } },
            include: { staff: true },
            orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json({ success: true, data: leaves });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching leave requests' });
    }
};
exports.getLeaves = getLeaves;
const updateLeaveStatus = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = leaveStatusSchema.parse(req.body);
        const leave = await prisma_1.default.staffLeave.findFirst({
            where: { id: req.params.leaveId, staff: { user: { schoolId: req.user.schoolId } } },
        });
        if (!leave)
            return res.status(404).json({ success: false, message: 'Leave request not found' });
        const updated = await prisma_1.default.staffLeave.update({
            where: { id: leave.id },
            data: {
                status: data.status,
                remarks: data.remarks,
                approvedBy: req.user.id,
                approvedDate: new Date().toISOString().slice(0, 10),
            },
        });
        return res.status(200).json({ success: true, data: updated });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: error.errors[0].message });
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error updating leave request' });
    }
};
exports.updateLeaveStatus = updateLeaveStatus;
const processPayroll = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = payrollSchema.parse(req.body);
        const { first, last } = monthRange(data.month, data.year);
        const staff = await prisma_1.default.staffProfile.findMany({
            where: { user: { schoolId: req.user.schoolId, status: 'ACTIVE' } },
            include: {
                salaries: { where: { effectiveFrom: { lte: last } }, orderBy: { effectiveFrom: 'desc' }, take: 1 },
                staffAttendance: { where: { date: { gte: first, lte: last } } },
                leaves: { where: { status: 'APPROVED', leaveType: 'UNPAID', fromDate: { lte: last }, toDate: { gte: first } } },
            },
        });
        const payableStaff = staff.filter((member) => member.salaries[0]);
        if (!payableStaff.length)
            return res.status(400).json({ success: false, message: 'Configure at least one salary structure before processing payroll' });
        const run = await prisma_1.default.$transaction(async (tx) => {
            const existing = await tx.payrollRun.findUnique({
                where: { schoolId_month_year: { schoolId: req.user.schoolId, month: data.month, year: data.year } },
            });
            if (existing)
                await tx.payrollItem.deleteMany({ where: { payrollRunId: existing.id } });
            const payrollRun = existing
                ? await tx.payrollRun.update({ where: { id: existing.id }, data: { workingDays: data.workingDays, status: 'PROCESSED' } })
                : await tx.payrollRun.create({ data: { schoolId: req.user.schoolId, month: data.month, year: data.year, workingDays: data.workingDays, status: 'PROCESSED' } });
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: error.errors[0].message });
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error processing payroll' });
    }
};
exports.processPayroll = processPayroll;
const getPayrollRuns = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const runs = await prisma_1.default.payrollRun.findMany({
            where: { schoolId: req.user.schoolId },
            include: { items: { include: { staff: true }, orderBy: { staff: { firstName: 'asc' } } } },
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
        });
        return res.status(200).json({ success: true, data: runs });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching payroll runs' });
    }
};
exports.getPayrollRuns = getPayrollRuns;
const markPayrollPaid = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const run = await prisma_1.default.payrollRun.findFirst({ where: { id: req.params.runId, schoolId: req.user.schoolId } });
        if (!run)
            return res.status(404).json({ success: false, message: 'Payroll run not found' });
        const paidDate = new Date().toISOString().slice(0, 10);
        await prisma_1.default.payrollItem.updateMany({ where: { payrollRunId: run.id }, data: { paymentStatus: 'PAID', paidDate } });
        const updated = await prisma_1.default.payrollRun.update({
            where: { id: run.id },
            data: { status: 'PAID' },
            include: { items: { include: { staff: true } } },
        });
        return res.status(200).json({ success: true, data: updated });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error marking payroll as paid' });
    }
};
exports.markPayrollPaid = markPayrollPaid;
const exportBankTransfer = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const run = await prisma_1.default.payrollRun.findFirst({
            where: { id: req.params.runId, schoolId: req.user.schoolId },
            include: { items: { include: { staff: true } } },
        });
        if (!run)
            return res.status(404).json({ success: false, message: 'Payroll run not found' });
        const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error exporting bank transfer file' });
    }
};
exports.exportBankTransfer = exportBankTransfer;
