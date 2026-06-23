"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccountsSummary = exports.getLedgerEntries = exports.recordLedgerEntry = exports.getAccountHeads = exports.createAccountHead = void 0;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../utils/prisma"));
const accountHeadSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Account name is required'),
    type: zod_1.z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE']),
    openingBalance: zod_1.z.coerce.number().min(0, 'Opening balance must be at least 0'),
});
const ledgerEntrySchema = zod_1.z.object({
    accountHeadId: zod_1.z.string().min(1, 'Account head is required'),
    transactionType: zod_1.z.enum(['DEBIT', 'CREDIT']),
    amount: zod_1.z.coerce.number().positive('Amount must be greater than zero'),
    date: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
});
const createAccountHead = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = accountHeadSchema.parse(req.body);
        const account = await prisma_1.default.accountHead.create({
            data: {
                schoolId: req.user.schoolId,
                name: data.name,
                type: data.type,
                openingBalance: data.openingBalance,
            },
        });
        return res.status(201).json({ success: true, data: account });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ success: false, message: error.errors[0].message });
        }
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error creating account head' });
    }
};
exports.createAccountHead = createAccountHead;
const getAccountHeads = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const accounts = await prisma_1.default.accountHead.findMany({
            where: { schoolId: req.user.schoolId },
            orderBy: { name: 'asc' },
        });
        return res.status(200).json({ success: true, data: accounts });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching account heads' });
    }
};
exports.getAccountHeads = getAccountHeads;
const recordLedgerEntry = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = ledgerEntrySchema.parse(req.body);
        const accountHead = await prisma_1.default.accountHead.findFirst({ where: { id: data.accountHeadId, schoolId: req.user.schoolId } });
        if (!accountHead)
            return res.status(404).json({ success: false, message: 'Account head not found' });
        const entry = await prisma_1.default.ledgerEntry.create({
            data: {
                schoolId: req.user.schoolId,
                accountHeadId: accountHead.id,
                transactionType: data.transactionType,
                amount: data.amount,
                date: data.date || new Date().toISOString().slice(0, 10),
                description: data.description,
            },
            include: { accountHead: true },
        });
        return res.status(201).json({ success: true, data: entry });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ success: false, message: error.errors[0].message });
        }
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error recording ledger entry' });
    }
};
exports.recordLedgerEntry = recordLedgerEntry;
const getLedgerEntries = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const entries = await prisma_1.default.ledgerEntry.findMany({
            where: { schoolId: req.user.schoolId },
            include: { accountHead: true },
            orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json({ success: true, data: entries });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching ledger entries' });
    }
};
exports.getLedgerEntries = getLedgerEntries;
const getAccountsSummary = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const [accounts, entries] = await Promise.all([
            prisma_1.default.accountHead.findMany({ where: { schoolId: req.user.schoolId } }),
            prisma_1.default.ledgerEntry.findMany({ where: { schoolId: req.user.schoolId } }),
        ]);
        const totals = entries.reduce((acc, entry) => {
            if (entry.transactionType === 'DEBIT') {
                acc.totalDebit += entry.amount;
            }
            else {
                acc.totalCredit += entry.amount;
            }
            return acc;
        }, { totalDebit: 0, totalCredit: 0 });
        return res.status(200).json({
            success: true,
            data: {
                accountCount: accounts.length,
                totalDebit: totals.totalDebit,
                totalCredit: totals.totalCredit,
                netBalance: totals.totalDebit - totals.totalCredit,
                accounts,
                ledgerCount: entries.length,
            },
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error generating account summary' });
    }
};
exports.getAccountsSummary = getAccountsSummary;
