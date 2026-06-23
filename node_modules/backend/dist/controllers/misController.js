"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMISDashboard = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getMISDashboard = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const schoolId = req.user.schoolId;
        const [studentCount, staffCount, classCount, sectionCount, vehicleCount, routeCount, bookCount] = await Promise.all([
            prisma_1.default.studentProfile.count({ where: { user: { schoolId } } }),
            prisma_1.default.staffProfile.count({ where: { user: { schoolId } } }),
            prisma_1.default.class.count({ where: { schoolId } }),
            prisma_1.default.section.count({ where: { class: { schoolId } } }),
            prisma_1.default.transportVehicle.count({ where: { schoolId } }),
            prisma_1.default.transportRoute.count({ where: { schoolId } }),
            prisma_1.default.libraryBook.count({ where: { schoolId } }),
        ]);
        const [feePayments, issuedBooks, ledgerEntries] = await Promise.all([
            prisma_1.default.feePayment.findMany({ where: { student: { user: { schoolId } } } }),
            prisma_1.default.libraryIssue.count({ where: { book: { schoolId }, status: 'ISSUED' } }),
            prisma_1.default.ledgerEntry.findMany({ where: { schoolId } }),
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching MIS dashboard summary' });
    }
};
exports.getMISDashboard = getMISDashboard;
