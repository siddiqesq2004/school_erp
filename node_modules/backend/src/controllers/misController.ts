import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export const getMISDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const schoolId = req.user.schoolId;

    const [studentCount, staffCount, classCount, sectionCount, vehicleCount, routeCount, bookCount] = await Promise.all([
      prisma.studentProfile.count({ where: { user: { schoolId } } }),
      prisma.staffProfile.count({ where: { user: { schoolId } } }),
      prisma.class.count({ where: { schoolId } }),
      prisma.section.count({ where: { class: { schoolId } } }),
      prisma.transportVehicle.count({ where: { schoolId } }),
      prisma.transportRoute.count({ where: { schoolId } }),
      prisma.libraryBook.count({ where: { schoolId } }),
    ]);

    const [feePayments, issuedBooks, ledgerEntries] = await Promise.all([
      prisma.feePayment.findMany({ where: { student: { user: { schoolId } } } }),
      prisma.libraryIssue.count({ where: { book: { schoolId }, status: 'ISSUED' } }),
      prisma.ledgerEntry.findMany({ where: { schoolId } }),
    ]);

    const totalDue = feePayments.reduce((sum, payment) => sum + payment.amount, 0);
    const collected = feePayments.reduce((sum, payment) => sum + payment.paidAmount, 0);
    const outstanding = totalDue - collected;
    const overdueCount = feePayments.filter((payment) => payment.status === 'OVERDUE').length;
    const debitTotal = ledgerEntries.reduce((sum, entry) => (entry.transactionType === 'DEBIT' ? sum + entry.amount : sum), 0);
    const creditTotal = ledgerEntries.reduce((sum, entry) => (entry.transactionType === 'CREDIT' ? sum + entry.amount : sum), 0);

    return res.status(200).json({
      success: true,
      data: {
        studentCount,
        staffCount,
        classCount,
        sectionCount,
        vehicleCount,
        routeCount,
        bookCount,
        issuedBooks,
        totalDue,
        collected,
        outstanding,
        overdueCount,
        debitTotal,
        creditTotal,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error fetching MIS dashboard summary' });
  }
};