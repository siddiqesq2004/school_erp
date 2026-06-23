"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLibrarySummary = exports.returnBook = exports.issueBook = exports.getIssues = exports.getBooks = exports.createBook = void 0;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../utils/prisma"));
const bookSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Book title is required'),
    author: zod_1.z.string().optional(),
    isbn: zod_1.z.string().optional(),
    publisher: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    totalCopies: zod_1.z.coerce.number().int().min(1, 'Total copies must be at least 1'),
});
const issueSchema = zod_1.z
    .object({
    bookId: zod_1.z.string().min(1, 'Book ID is required'),
    studentId: zod_1.z.string().optional(),
    staffId: zod_1.z.string().optional(),
    dueDate: zod_1.z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, 'Due date must be YYYY-MM-DD'),
})
    .refine((data) => !!data.studentId || !!data.staffId, {
    message: 'Student or staff recipient is required',
});
const returnSchema = zod_1.z.object({
    issueId: zod_1.z.string().min(1, 'Issue ID is required'),
    returnDate: zod_1.z.string().optional(),
});
const createBook = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = bookSchema.parse(req.body);
        const book = await prisma_1.default.libraryBook.create({
            data: {
                schoolId: req.user.schoolId,
                title: data.title,
                author: data.author,
                isbn: data.isbn,
                publisher: data.publisher,
                category: data.category,
                totalCopies: data.totalCopies,
                availableCopies: data.totalCopies,
            },
        });
        return res.status(201).json({ success: true, data: book });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ success: false, message: error.errors[0].message });
        }
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error creating library book' });
    }
};
exports.createBook = createBook;
const getBooks = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const books = await prisma_1.default.libraryBook.findMany({
            where: { schoolId: req.user.schoolId },
            orderBy: { title: 'asc' },
        });
        return res.status(200).json({ success: true, data: books });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching library books' });
    }
};
exports.getBooks = getBooks;
const getIssues = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const issues = await prisma_1.default.libraryIssue.findMany({
            where: { book: { schoolId: req.user.schoolId } },
            include: {
                book: true,
                student: { select: { id: true, firstName: true, lastName: true } },
                staff: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json({ success: true, data: issues });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching library issues' });
    }
};
exports.getIssues = getIssues;
const issueBook = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = issueSchema.parse(req.body);
        const book = await prisma_1.default.libraryBook.findFirst({ where: { id: data.bookId, schoolId: req.user.schoolId } });
        if (!book)
            return res.status(404).json({ success: false, message: 'Book not found' });
        if (book.availableCopies < 1)
            return res.status(400).json({ success: false, message: 'No copies available to issue' });
        let student = null;
        let staff = null;
        let issueType = 'STUDENT';
        if (data.studentId) {
            student = await prisma_1.default.studentProfile.findFirst({ where: { id: data.studentId, user: { schoolId: req.user.schoolId } } });
            if (!student)
                return res.status(404).json({ success: false, message: 'Student not found for this school' });
        }
        else {
            issueType = 'STAFF';
            staff = await prisma_1.default.staffProfile.findFirst({ where: { id: data.staffId, user: { schoolId: req.user.schoolId } } });
            if (!staff)
                return res.status(404).json({ success: false, message: 'Staff member not found for this school' });
        }
        const issue = await prisma_1.default.libraryIssue.create({
            data: {
                bookId: book.id,
                studentId: student?.id,
                staffId: staff?.id,
                issueType,
                issueDate: new Date().toISOString().slice(0, 10),
                dueDate: data.dueDate,
                status: 'ISSUED',
            },
            include: {
                book: true,
                student: { select: { id: true, firstName: true, lastName: true } },
                staff: { select: { id: true, firstName: true, lastName: true } },
            },
        });
        await prisma_1.default.libraryBook.update({
            where: { id: book.id },
            data: { availableCopies: { decrement: 1 } },
        });
        return res.status(201).json({ success: true, data: issue });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ success: false, message: error.errors[0].message });
        }
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error issuing library book' });
    }
};
exports.issueBook = issueBook;
const returnBook = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = returnSchema.parse(req.body);
        const issue = await prisma_1.default.libraryIssue.findFirst({
            where: { id: data.issueId, book: { schoolId: req.user.schoolId } },
            include: { book: true },
        });
        if (!issue)
            return res.status(404).json({ success: false, message: 'Library issue record not found' });
        if (issue.status !== 'ISSUED')
            return res.status(400).json({ success: false, message: 'Only issued books can be returned' });
        const updatedIssue = await prisma_1.default.libraryIssue.update({
            where: { id: issue.id },
            data: {
                returnDate: data.returnDate || new Date().toISOString().slice(0, 10),
                status: 'RETURNED',
            },
            include: {
                book: true,
                student: { select: { id: true, firstName: true, lastName: true } },
                staff: { select: { id: true, firstName: true, lastName: true } },
            },
        });
        await prisma_1.default.libraryBook.update({
            where: { id: issue.bookId },
            data: { availableCopies: { increment: 1 } },
        });
        return res.status(200).json({ success: true, data: updatedIssue });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ success: false, message: error.errors[0].message });
        }
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error returning library book' });
    }
};
exports.returnBook = returnBook;
const getLibrarySummary = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const [bookCount, activeIssues, issuedCount] = await Promise.all([
            prisma_1.default.libraryBook.count({ where: { schoolId: req.user.schoolId } }),
            prisma_1.default.libraryIssue.count({ where: { book: { schoolId: req.user.schoolId }, status: 'ISSUED' } }),
            prisma_1.default.libraryIssue.count({ where: { book: { schoolId: req.user.schoolId } } }),
        ]);
        return res.status(200).json({
            success: true,
            data: {
                bookCount,
                activeIssues,
                totalIssues: issuedCount,
            },
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error generating library summary' });
    }
};
exports.getLibrarySummary = getLibrarySummary;
