import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const bookSchema = z.object({
  title: z.string().min(1, 'Book title is required'),
  author: z.string().optional(),
  isbn: z.string().optional(),
  publisher: z.string().optional(),
  category: z.string().optional(),
  totalCopies: z.coerce.number().int().min(1, 'Total copies must be at least 1'),
});

const issueSchema = z
  .object({
    bookId: z.string().min(1, 'Book ID is required'),
    studentId: z.string().optional(),
    staffId: z.string().optional(),
    dueDate: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, 'Due date must be YYYY-MM-DD'),
  })
  .refine((data) => !!data.studentId || !!data.staffId, {
    message: 'Student or staff recipient is required',
  });

const returnSchema = z.object({
  issueId: z.string().min(1, 'Issue ID is required'),
  returnDate: z.string().optional(),
});

export const createBook = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const data = bookSchema.parse(req.body);

    const book = await prisma.libraryBook.create({
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error creating library book' });
  }
};

export const getBooks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });

    const books = await prisma.libraryBook.findMany({
      where: { schoolId: req.user.schoolId },
      orderBy: { title: 'asc' },
    });

    return res.status(200).json({ success: true, data: books });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error fetching library books' });
  }
};

export const getIssues = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });

    const issues = await prisma.libraryIssue.findMany({
      where: { book: { schoolId: req.user.schoolId } },
      include: {
        book: true,
        student: { select: { id: true, firstName: true, lastName: true } },
        staff: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ success: true, data: issues });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error fetching library issues' });
  }
};

export const issueBook = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const data = issueSchema.parse(req.body);

    const book = await prisma.libraryBook.findFirst({ where: { id: data.bookId, schoolId: req.user.schoolId } });
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
    if (book.availableCopies < 1) return res.status(400).json({ success: false, message: 'No copies available to issue' });

    let student = null;
    let staff = null;
    let issueType = 'STUDENT';

    if (data.studentId) {
      student = await prisma.studentProfile.findFirst({ where: { id: data.studentId, user: { schoolId: req.user.schoolId } } });
      if (!student) return res.status(404).json({ success: false, message: 'Student not found for this school' });
    } else {
      issueType = 'STAFF';
      staff = await prisma.staffProfile.findFirst({ where: { id: data.staffId, user: { schoolId: req.user.schoolId } } });
      if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found for this school' });
    }

    const issue = await prisma.libraryIssue.create({
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

    await prisma.libraryBook.update({
      where: { id: book.id },
      data: { availableCopies: { decrement: 1 } },
    });

    return res.status(201).json({ success: true, data: issue });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error issuing library book' });
  }
};

export const returnBook = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const data = returnSchema.parse(req.body);

    const issue = await prisma.libraryIssue.findFirst({
      where: { id: data.issueId, book: { schoolId: req.user.schoolId } },
      include: { book: true },
    });

    if (!issue) return res.status(404).json({ success: false, message: 'Library issue record not found' });
    if (issue.status !== 'ISSUED') return res.status(400).json({ success: false, message: 'Only issued books can be returned' });

    const updatedIssue = await prisma.libraryIssue.update({
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

    await prisma.libraryBook.update({
      where: { id: issue.bookId },
      data: { availableCopies: { increment: 1 } },
    });

    return res.status(200).json({ success: true, data: updatedIssue });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error returning library book' });
  }
};

export const getLibrarySummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });

    const [bookCount, activeIssues, issuedCount] = await Promise.all([
      prisma.libraryBook.count({ where: { schoolId: req.user.schoolId } }),
      prisma.libraryIssue.count({ where: { book: { schoolId: req.user.schoolId }, status: 'ISSUED' } }),
      prisma.libraryIssue.count({ where: { book: { schoolId: req.user.schoolId } } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        bookCount,
        activeIssues,
        totalIssues: issuedCount,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error generating library summary' });
  }
};