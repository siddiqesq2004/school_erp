// ═══════════════════════════════════════════════════════════
// PHASE 12 — Support portal, Knowledge base, Video tutorials
// ═══════════════════════════════════════════════════════════
import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import prisma from '../utils/prisma';

function genTicketNo() {
  return `TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

// ═══ SUPPORT TICKETS ═══
export const listTickets = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, priority } = req.query as any;
    const where: any = { schoolId: req.user!.schoolId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    const tickets = await prisma.supportTicket.findMany({
      where,
      include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: tickets });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const createTicket = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { subject, description, category, priority } = req.body;
    if (!subject || !description) {
      return res.status(400).json({ success: false, message: 'subject and description are required' });
    }
    const ticket = await prisma.supportTicket.create({
      data: {
        schoolId: req.user!.schoolId,
        userId: req.user!.id,
        ticketNo: genTicketNo(),
        subject, description,
        category: category || 'GENERAL',
        priority: priority || 'MEDIUM',
      },
    });
    res.status(201).json({ success: true, data: ticket, message: 'Support ticket created' });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const getTicket = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: req.params.id, schoolId: req.user!.schoolId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.json({ success: true, data: ticket });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const addTicketMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'message is required' });

    const ticket = await prisma.supportTicket.findFirst({
      where: { id: req.params.id, schoolId: req.user!.schoolId },
    });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const msg = await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        userId: req.user!.id,
        message,
        isStaff: false,
      },
    });
    res.status(201).json({ success: true, data: msg });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const updateTicketStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, priority } = req.body;
    const data: any = {};
    if (status) {
      data.status = status;
      if (status === 'RESOLVED') data.resolvedAt = new Date();
      if (status === 'CLOSED') data.closedAt = new Date();
    }
    if (priority) data.priority = priority;

    const ticket = await prisma.supportTicket.update({
      where: { id: req.params.id, schoolId: req.user!.schoolId },
      data,
    });
    res.json({ success: true, data: ticket });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ═══ KNOWLEDGE BASE ═══
export const listKBArticles = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, q } = req.query as any;
    const where: any = { schoolId: req.user!.schoolId, isPublished: true };
    if (category) where.category = category;
    if (q) where.title = { contains: q };

    const articles = await prisma.knowledgeBase.findMany({
      where,
      orderBy: { views: 'desc' },
    });
    res.json({ success: true, data: articles });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const createKBArticle = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, slug, content, category, tags, isPublished } = req.body;
    if (!title || !slug || !content) {
      return res.status(400).json({ success: false, message: 'title, slug, content are required' });
    }
    const article = await prisma.knowledgeBase.create({
      data: {
        schoolId: req.user!.schoolId,
        title, slug, content,
        category: category || 'GENERAL',
        tags: tags ? JSON.stringify(tags) : null,
        isPublished: isPublished !== false,
        authorId: req.user!.id,
      },
    });
    res.status(201).json({ success: true, data: article });
  } catch (e: any) {
    if (e.code === 'P2002') return res.status(409).json({ success: false, message: 'Slug already exists' });
    res.status(500).json({ success: false, message: e.message });
  }
};

export const viewKBArticle = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const article = await prisma.knowledgeBase.update({
      where: { id: req.params.id, schoolId: req.user!.schoolId },
      data: { views: { increment: 1 } },
    });
    res.json({ success: true, data: article });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ═══ VIDEO TUTORIALS ═══
export const listVideos = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { module, category } = req.query as any;
    const where: any = { schoolId: req.user!.schoolId, isPublished: true };
    if (module) where.module = module;
    if (category) where.category = category;
    const videos = await prisma.videoTutorial.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: videos });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const createVideo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, videoUrl, thumbnailUrl, duration, module, category } = req.body;
    if (!title || !videoUrl) {
      return res.status(400).json({ success: false, message: 'title and videoUrl are required' });
    }
    const video = await prisma.videoTutorial.create({
      data: {
        schoolId: req.user!.schoolId,
        title, description, videoUrl, thumbnailUrl,
        duration, module: module || 'GENERAL',
        category: category || 'TUTORIAL',
      },
    });
    res.status(201).json({ success: true, data: video });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const viewVideo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const video = await prisma.videoTutorial.update({
      where: { id: req.params.id, schoolId: req.user!.schoolId },
      data: { views: { increment: 1 } },
    });
    res.json({ success: true, data: video });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ═══ HEALTH & METRICS (system hardening) ═══
export const systemHealth = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [dbCheck, ticketCount, openCount] = await Promise.all([
      prisma.$queryRaw`SELECT 1 as ok`.then(() => true).catch(() => false),
      prisma.supportTicket.count({ where: { schoolId: req.user!.schoolId } }),
      prisma.supportTicket.count({ where: { schoolId: req.user!.schoolId, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    ]);
    res.json({
      success: true,
      data: {
        status: dbCheck ? 'healthy' : 'degraded',
        uptime: process.uptime(),
        timestamp: new Date(),
        tickets: { total: ticketCount, open: openCount },
        nodeVersion: process.version,
        memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};
