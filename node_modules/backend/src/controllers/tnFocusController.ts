// ═══════════════════════════════════════════════════════════
// TAMIL NADU FOCUS — Samacheer Kalvi, Tamil templates, Aided grants
// ═══════════════════════════════════════════════════════════
import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import prisma from '../utils/prisma';
import {
  computeSamacheerGrade,
  computeTermTotal,
  computeAnnualTotal,
  SamacheerGrade,
} from '../utils/samacheerGrading';
import {
  renderTemplate,
  extractVariables,
  DEFAULT_TAMIL_TEMPLATES,
  TemplateLanguage,
} from '../utils/tamilTemplateEngine';

// ═══ SAMACHEER CONFIG ═══
export const getSamacheerConfig = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cfg = await prisma.samacheerConfig.upsert({
      where: { schoolId: req.user!.schoolId },
      update: {},
      create: { schoolId: req.user!.schoolId },
    });
    res.json({ success: true, data: cfg });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const updateSamacheerConfig = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cfg = await prisma.samacheerConfig.upsert({
      where: { schoolId: req.user!.schoolId },
      update: req.body,
      create: { schoolId: req.user!.schoolId, ...req.body },
    });
    res.json({ success: true, data: cfg, message: 'Samacheer config updated' });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ═══ SAMACHEER MARKS (Term-based) ═══
export const enterSamacheerMark = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      studentId, classId, subjectName, academicYear, term, examType,
      theoryMarks, practicalMarks, maxMarks, remarks,
    } = req.body;

    if (!studentId || !classId || !subjectName || !academicYear || !term) {
      return res.status(400).json({ success: false, message: 'studentId, classId, subjectName, academicYear, term are required' });
    }

    const total = computeTermTotal(Number(theoryMarks || 0), Number(practicalMarks || 0));
    const grade = computeSamacheerGrade(total, Number(maxMarks || 100));

    const mark = await prisma.samacheerMark.create({
      data: {
        schoolId: req.user!.schoolId,
        studentId, classId, subjectName, academicYear,
        term: Number(term),
        examType: examType || 'WRITTEN',
        theoryMarks: Number(theoryMarks || 0),
        practicalMarks: Number(practicalMarks || 0),
        totalMarks: total,
        maxMarks: Number(maxMarks || 100),
        grade,
        remarks,
        enteredBy: req.user!.id,
      },
    });
    res.status(201).json({ success: true, data: mark, message: 'Samacheer mark entered' });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const listSamacheerMarks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId, classId, academicYear, term } = req.query as any;
    const where: any = { schoolId: req.user!.schoolId };
    if (studentId) where.studentId = studentId;
    if (classId) where.classId = classId;
    if (academicYear) where.academicYear = academicYear;
    if (term) where.term = Number(term);

    const marks = await prisma.samacheerMark.findMany({
      where,
      orderBy: [{ academicYear: 'desc' }, { term: 'asc' }],
    });
    res.json({ success: true, data: marks });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const computeStudentAnnual = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId, academicYear } = req.params;
    const marks = await prisma.samacheerMark.findMany({
      where: { schoolId: req.user!.schoolId, studentId, academicYear },
    });

    // Group by subject
    const bySubject: Record<string, { t1: number; t2: number; t3: number }> = {};
    for (const m of marks) {
      if (!bySubject[m.subjectName]) bySubject[m.subjectName] = { t1: 0, t2: 0, t3: 0 };
      bySubject[m.subjectName][`t${m.term}` as 't1' | 't2' | 't3'] = m.totalMarks;
    }

    const result = Object.entries(bySubject).map(([subject, scores]) => {
      const { total, average, grade } = computeAnnualTotal(scores.t1, scores.t2, scores.t3);
      return { subject, ...scores, total, average, grade };
    });

    res.json({ success: true, data: { studentId, academicYear, subjects: result } });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ═══ TAMIL TEMPLATES ═══
export const listTamilTemplates = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, language } = req.query as any;
    const where: any = { schoolId: req.user!.schoolId };
    if (category) where.category = category;
    if (language) where.language = language;
    const templates = await prisma.tamilTemplate.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    res.json({ success: true, data: templates });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const createTamilTemplate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, category, language, subject, body, description, isActive } = req.body;
    if (!name || !body) return res.status(400).json({ success: false, message: 'name and body are required' });
    const variables = extractVariables(body);
    const tpl = await prisma.tamilTemplate.create({
      data: {
        schoolId: req.user!.schoolId,
        name, category: category || 'GENERAL',
        language: language || 'TA',
        subject, body,
        variables: JSON.stringify(variables),
        description, isActive: isActive !== false,
      },
    });
    res.status(201).json({ success: true, data: tpl });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const previewTamilTemplate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { body, language, variables } = req.body;
    if (!body) return res.status(400).json({ success: false, message: 'body is required' });
    const vars = typeof variables === 'string' ? JSON.parse(variables || '{}') : (variables || {});
    const rendered = renderTemplate(body, vars, (language as TemplateLanguage) || 'EN');
    const extracted = extractVariables(body);
    res.json({ success: true, data: { rendered, variables: extracted, language: language || 'EN' } });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const seedDefaultTamilTemplates = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const created: any[] = [];
    for (const [key, tpl] of Object.entries(DEFAULT_TAMIL_TEMPLATES)) {
      const exists = await prisma.tamilTemplate.findFirst({
        where: { schoolId: req.user!.schoolId, name: tpl.name },
      });
      if (!exists) {
        const variables = extractVariables(tpl.body);
        const doc = await prisma.tamilTemplate.create({
          data: {
            schoolId: req.user!.schoolId,
            name: tpl.name,
            category: tpl.category,
            language: key.endsWith('_TA') ? 'TA' : 'EN',
            subject: tpl.subject,
            body: tpl.body,
            variables: JSON.stringify(variables),
            isActive: true,
            description: `Seeded from defaults (${key})`,
          },
        });
        created.push(doc);
      }
    }
    res.json({ success: true, data: created, message: `${created.length} default Tamil templates seeded` });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ═══ AIDED GRANTS ═══
export const listAidedGrants = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { financialYear, status } = req.query as any;
    const where: any = { schoolId: req.user!.schoolId };
    if (financialYear) where.financialYear = financialYear;
    if (status) where.status = status;
    const grants = await prisma.aidedGrant.findMany({
      where,
      include: { claims: true },
      orderBy: { financialYear: 'desc' },
    });
    res.json({ success: true, data: grants });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const createAidedGrant = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      grantType, financialYear, sanctionedAmount, purpose,
      sanctionOrderNo, sanctionDate, beneficiaryCount, remarks,
    } = req.body;
    if (!grantType || !financialYear || !sanctionedAmount) {
      return res.status(400).json({ success: false, message: 'grantType, financialYear, sanctionedAmount are required' });
    }
    const grant = await prisma.aidedGrant.create({
      data: {
        schoolId: req.user!.schoolId,
        grantType, financialYear,
        sanctionedAmount: Number(sanctionedAmount),
        pendingAmount: Number(sanctionedAmount),
        purpose, sanctionOrderNo, sanctionDate,
        beneficiaryCount: Number(beneficiaryCount || 0),
        remarks,
      },
    });
    res.status(201).json({ success: true, data: grant, message: 'Aided grant created' });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const receiveGrant = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { receivedAmount, receivedDate } = req.body;
    if (!receivedAmount) return res.status(400).json({ success: false, message: 'receivedAmount is required' });

    const grant = await prisma.aidedGrant.findFirst({
      where: { id: req.params.id, schoolId: req.user!.schoolId },
    });
    if (!grant) return res.status(404).json({ success: false, message: 'Grant not found' });

    const newReceived = grant.receivedAmount + Number(receivedAmount);
    const newPending = grant.sanctionedAmount - newReceived;
    const newStatus = newPending <= 0 ? 'RECEIVED' : 'PARTIAL';

    const updated = await prisma.aidedGrant.update({
      where: { id: grant.id },
      data: {
        receivedAmount: newReceived,
        pendingAmount: newPending,
        status: newStatus,
        receivedDate: receivedDate || new Date().toISOString().slice(0, 10),
      },
    });
    res.json({ success: true, data: updated, message: `Grant status: ${newStatus}` });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const createGrantClaim = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period, claimAmount, documentUrl, remarks } = req.body;
    if (!period || !claimAmount) return res.status(400).json({ success: false, message: 'period and claimAmount are required' });

    const grant = await prisma.aidedGrant.findFirst({
      where: { id: req.params.id, schoolId: req.user!.schoolId },
    });
    if (!grant) return res.status(404).json({ success: false, message: 'Grant not found' });

    const claim = await prisma.grantClaim.create({
      data: {
        schoolId: req.user!.schoolId,
        grantId: grant.id,
        claimNo: `CLM-${Date.now().toString(36).toUpperCase()}`,
        period, claimAmount: Number(claimAmount),
        documentUrl, remarks,
      },
    });
    res.status(201).json({ success: true, data: claim });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const generateUC = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const claim = await prisma.grantClaim.update({
      where: { id: req.params.id, schoolId: req.user!.schoolId },
      data: {
        ucNumber: `UC-${Date.now().toString(36).toUpperCase()}`,
        ucGenerated: true,
        status: 'SUBMITTED',
        submittedDate: new Date().toISOString().slice(0, 10),
      },
    });
    res.json({ success: true, data: claim, message: 'Utilisation Certificate generated' });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const grantSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [grants, aggregate] = await Promise.all([
      prisma.aidedGrant.findMany({ where: { schoolId: req.user!.schoolId } }),
      prisma.aidedGrant.aggregate({
        where: { schoolId: req.user!.schoolId },
        _sum: { sanctionedAmount: true, receivedAmount: true, pendingAmount: true },
        _count: true,
      }),
    ]);
    const byType: Record<string, { count: number; sanctioned: number; received: number }> = {};
    for (const g of grants) {
      if (!byType[g.grantType]) byType[g.grantType] = { count: 0, sanctioned: 0, received: 0 };
      byType[g.grantType].count++;
      byType[g.grantType].sanctioned += g.sanctionedAmount;
      byType[g.grantType].received += g.receivedAmount;
    }
    res.json({
      success: true,
      data: {
        totals: aggregate._sum,
        grantCount: aggregate._count,
        byType,
      },
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};
