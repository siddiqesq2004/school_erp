"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.phase9Summary = exports.updateAdmissionStatus = exports.listAdmissions = exports.createAdmission = exports.listReports = exports.submitReport = exports.listBoards = exports.createBoard = exports.listUDISE = exports.createUDISE = void 0;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../utils/prisma"));
// Schemas
const udiseSchema = zod_1.z.object({
    year: zod_1.z.number().int(),
    udiseCode: zod_1.z.string(),
    totalStudents: zod_1.z.number().int().min(0),
    totalTeachers: zod_1.z.number().int().min(0),
    facilities: zod_1.z.string().optional(),
});
const boardSchema = zod_1.z.object({
    boardName: zod_1.z.string(),
    registrationNo: zod_1.z.string(),
    validFrom: zod_1.z.string().optional(),
    validTo: zod_1.z.string().optional(),
});
const reportSchema = zod_1.z.object({
    reportType: zod_1.z.string(),
    period: zod_1.z.string(),
    data: zod_1.z.string(),
});
const admissionSchema = zod_1.z.object({
    studentName: zod_1.z.string(),
    dob: zod_1.z.string(),
    classApplied: zod_1.z.string(),
    guardianName: zod_1.z.string().optional(),
});
// UDISE
const createUDISE = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = udiseSchema.parse(req.body);
        const record = await prisma_1.default.uDISERecord.create({
            data: { ...data, schoolId: req.user.schoolId },
        });
        return res.status(201).json({ success: true, data: record });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: err.errors[0].message });
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error creating UDISE record' });
    }
};
exports.createUDISE = createUDISE;
const listUDISE = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const records = await prisma_1.default.uDISERecord.findMany({ where: { schoolId: req.user.schoolId }, orderBy: { year: 'desc' } });
        return res.status(200).json({ success: true, data: records });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error fetching UDISE records' });
    }
};
exports.listUDISE = listUDISE;
// Board registrations
const createBoard = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = boardSchema.parse(req.body);
        const br = await prisma_1.default.boardRegistration.create({ data: { ...data, schoolId: req.user.schoolId } });
        return res.status(201).json({ success: true, data: br });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: err.errors[0].message });
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error creating board registration' });
    }
};
exports.createBoard = createBoard;
const listBoards = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const list = await prisma_1.default.boardRegistration.findMany({ where: { schoolId: req.user.schoolId } });
        return res.status(200).json({ success: true, data: list });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error fetching board registrations' });
    }
};
exports.listBoards = listBoards;
// Government reports
const submitReport = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = reportSchema.parse(req.body);
        const rep = await prisma_1.default.governmentReport.create({ data: { ...data, schoolId: req.user.schoolId } });
        return res.status(201).json({ success: true, data: rep });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: err.errors[0].message });
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error submitting report' });
    }
};
exports.submitReport = submitReport;
const listReports = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const list = await prisma_1.default.governmentReport.findMany({ where: { schoolId: req.user.schoolId }, orderBy: { createdAt: 'desc' } });
        return res.status(200).json({ success: true, data: list });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error fetching reports' });
    }
};
exports.listReports = listReports;
// Admissions
const createAdmission = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = admissionSchema.parse(req.body);
        const admission = await prisma_1.default.admission.create({ data: { ...data, schoolId: req.user.schoolId } });
        return res.status(201).json({ success: true, data: admission });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: err.errors[0].message });
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error creating admission' });
    }
};
exports.createAdmission = createAdmission;
const listAdmissions = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const list = await prisma_1.default.admission.findMany({ where: { schoolId: req.user.schoolId }, orderBy: { appliedAt: 'desc' } });
        return res.status(200).json({ success: true, data: list });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error fetching admissions' });
    }
};
exports.listAdmissions = listAdmissions;
const updateAdmissionStatus = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const { id } = req.params;
        const { status } = req.body;
        if (!['PENDING', 'ACCEPTED', 'REJECTED'].includes(status))
            return res.status(400).json({ success: false, message: 'Invalid status' });
        const updated = await prisma_1.default.admission.updateMany({ where: { id, schoolId: req.user.schoolId }, data: { status, processedAt: new Date().toISOString().slice(0, 10) } });
        if (updated.count === 0)
            return res.status(404).json({ success: false, message: 'Admission not found' });
        return res.status(200).json({ success: true, message: 'Admission updated' });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error updating admission' });
    }
};
exports.updateAdmissionStatus = updateAdmissionStatus;
// Minimal summary endpoint for Phase 9
const phase9Summary = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const schoolId = req.user.schoolId;
        const [udiseCount, boardCount, pendingAdmissions] = await Promise.all([
            prisma_1.default.uDISERecord.count({ where: { schoolId } }),
            prisma_1.default.boardRegistration.count({ where: { schoolId } }),
            prisma_1.default.admission.count({ where: { schoolId, status: 'PENDING' } }),
        ]);
        return res.status(200).json({ success: true, data: { udiseCount, boardCount, pendingAdmissions } });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error fetching summary' });
    }
};
exports.phase9Summary = phase9Summary;
exports.default = {};
