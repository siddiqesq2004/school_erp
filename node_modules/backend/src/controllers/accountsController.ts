import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const accountHeadSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE']),
  openingBalance: z.coerce.number().min(0, 'Opening balance must be at least 0'),
});

const ledgerEntrySchema = z.object({
  accountHeadId: z.string().min(1, 'Account head is required'),
  transactionType: z.enum(['DEBIT', 'CREDIT']),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  date: z.string().optional(),
  description: z.string().optional(),
});

export const createAccountHead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const data = accountHeadSchema.parse(req.body);

    const account = await prisma.accountHead.create({
      data: {
        schoolId: req.user.schoolId,
        name: data.name,
        type: data.type,
        openingBalance: data.openingBalance,
      },
    });

    return res.status(201).json({ success: true, data: account });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error creating account head' });
  }
};

export const getAccountHeads = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });

    const accounts = await prisma.accountHead.findMany({
      where: { schoolId: req.user.schoolId },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({ success: true, data: accounts });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error fetching account heads' });
  }
};

export const recordLedgerEntry = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const data = ledgerEntrySchema.parse(req.body);

    const accountHead = await prisma.accountHead.findFirst({ where: { id: data.accountHeadId, schoolId: req.user.schoolId } });
    if (!accountHead) return res.status(404).json({ success: false, message: 'Account head not found' });

    const entry = await prisma.ledgerEntry.create({
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error recording ledger entry' });
  }
};

export const getLedgerEntries = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });

    const entries = await prisma.ledgerEntry.findMany({
      where: { schoolId: req.user.schoolId },
      include: { accountHead: true },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ success: true, data: entries });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error fetching ledger entries' });
  }
};

export const getAccountsSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });

    const [accounts, entries] = await Promise.all([
      prisma.accountHead.findMany({ where: { schoolId: req.user.schoolId } }),
      prisma.ledgerEntry.findMany({ where: { schoolId: req.user.schoolId } }),
    ]);

    const totals = entries.reduce(
      (acc, entry) => {
        if (entry.transactionType === 'DEBIT') {
          acc.totalDebit += entry.amount;
        } else {
          acc.totalCredit += entry.amount;
        }
        return acc;
      },
      { totalDebit: 0, totalCredit: 0 }
    );

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
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error generating account summary' });
  }
};