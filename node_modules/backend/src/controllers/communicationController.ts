import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const settingSchema = z.object({
  whatsappEnabled: z.boolean().optional(),
  whatsappPhoneNumberId: z.string().optional(),
  whatsappBusinessId: z.string().optional(),
  whatsappAccessToken: z.string().optional(),
  whatsappVerifyToken: z.string().optional(),
  pushEnabled: z.boolean().optional(),
  firebaseProjectId: z.string().optional(),
  firebaseWebApiKey: z.string().optional(),
  firebaseVapidKey: z.string().optional(),
  simulationMode: z.boolean().optional(),
});

const circularSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  audience: z.enum(['ALL', 'STAFF', 'PARENTS', 'STUDENTS', 'CLASS']).default('ALL'),
  channels: z.array(z.enum(['PORTAL', 'WHATSAPP', 'PUSH'])).default(['PORTAL']),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
});

const deviceSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['WEB', 'ANDROID', 'IOS']).default('WEB'),
});

const manualMessageSchema = z.object({
  title: z.string().optional(),
  message: z.string().min(1),
  channels: z.array(z.enum(['WHATSAPP', 'PUSH', 'PORTAL'])).min(1),
  audience: z.enum(['ALL', 'STAFF', 'PARENTS', 'STUDENTS', 'CLASS']).default('ALL'),
  classId: z.string().optional(),
});

const getRecipients = async (schoolId: string, audience: string, classId?: string) => {
  if (audience === 'STAFF') {
    const staff = await prisma.staffProfile.findMany({ where: { user: { schoolId, status: 'ACTIVE' } }, include: { user: true } });
    return staff.map((item) => ({ userId: item.userId, name: `${item.firstName} ${item.lastName}`, phone: item.phone || '', role: item.user.role }));
  }

  const students = await prisma.studentProfile.findMany({
    where: { user: { schoolId }, ...(audience === 'CLASS' && classId ? { classId } : {}) },
    include: { user: true, parents: { include: { user: true } } },
  });

  if (audience === 'STUDENTS') {
    return students.map((item) => ({ userId: item.userId, name: `${item.firstName} ${item.lastName}`, phone: item.guardianPhone || '', role: 'STUDENT' }));
  }

  const parents = students.flatMap((student) =>
    student.parents.map((parent) => ({ userId: parent.userId, name: parent.name, phone: parent.phone, role: 'PARENT' }))
  );
  if (audience === 'PARENTS' || audience === 'CLASS') return parents;

  return [
    ...students.map((item) => ({ userId: item.userId, name: `${item.firstName} ${item.lastName}`, phone: item.guardianPhone || '', role: 'STUDENT' })),
    ...parents,
  ];
};

const logDelivery = async (schoolId: string, userId: string | undefined, recipient: string, channel: string, title: string | undefined, message: string, status = 'SIMULATED', errorMessage?: string) =>
  prisma.communicationLog.create({
    data: {
      schoolId,
      userId,
      recipient,
      channel,
      title,
      message,
      status,
      errorMessage,
      sentAt: new Date().toISOString(),
    },
  });

const sendToRecipients = async (schoolId: string, recipients: Awaited<ReturnType<typeof getRecipients>>, channels: string[], title: string | undefined, message: string) => {
  const setting = await prisma.communicationSetting.findUnique({ where: { schoolId } });
  const logs = [];

  for (const recipient of recipients) {
    for (const channel of channels) {
      if (channel === 'WHATSAPP' && (!setting?.whatsappEnabled || setting.simulationMode || !setting.whatsappAccessToken || !setting.whatsappPhoneNumberId || !recipient.phone)) {
        logs.push(await logDelivery(schoolId, recipient.userId, recipient.phone || recipient.name, channel, title, message, 'SIMULATED', recipient.phone ? undefined : 'No phone number on profile'));
        continue;
      }
      if (channel === 'PUSH' && (!setting?.pushEnabled || setting.simulationMode)) {
        logs.push(await logDelivery(schoolId, recipient.userId, recipient.name, channel, title, message, 'SIMULATED'));
        continue;
      }
      logs.push(await logDelivery(schoolId, recipient.userId, recipient.phone || recipient.name, channel, title, message, 'QUEUED'));
    }
  }

  return logs;
};

export const getCommunicationSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const settings = await prisma.communicationSetting.upsert({
      where: { schoolId: req.user.schoolId },
      update: {},
      create: { schoolId: req.user.schoolId, simulationMode: true },
    });
    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error fetching communication settings' });
  }
};

export const updateCommunicationSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const data = settingSchema.parse(req.body);
    const settings = await prisma.communicationSetting.upsert({
      where: { schoolId: req.user.schoolId },
      update: data,
      create: { schoolId: req.user.schoolId, ...data },
    });
    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: error.errors[0].message });
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error saving communication settings' });
  }
};

export const createCircular = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const data = circularSchema.parse(req.body);
    const circular = await prisma.circular.create({
      data: {
        schoolId: req.user.schoolId,
        title: data.title,
        message: data.message,
        audience: data.audience,
        channels: data.channels.join(','),
        classId: data.classId,
        sectionId: data.sectionId,
        status: data.status || 'DRAFT',
        publishedAt: data.status === 'PUBLISHED' ? new Date().toISOString() : undefined,
        createdBy: req.user.id,
      },
      include: { class: true, section: true },
    });

    if (circular.status === 'PUBLISHED') {
      const recipients = await getRecipients(req.user.schoolId, circular.audience, circular.classId || undefined);
      await sendToRecipients(req.user.schoolId, recipients, circular.channels.split(','), circular.title, circular.message);
    }

    return res.status(201).json({ success: true, data: circular });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: error.errors[0].message });
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error creating circular' });
  }
};

export const getCirculars = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const circulars = await prisma.circular.findMany({
      where: { schoolId: req.user.schoolId },
      include: { class: true, section: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ success: true, data: circulars });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error fetching circulars' });
  }
};

export const publishCircular = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const circular = await prisma.circular.findFirst({ where: { id: req.params.circularId, schoolId: req.user.schoolId } });
    if (!circular) return res.status(404).json({ success: false, message: 'Circular not found' });
    const updated = await prisma.circular.update({ where: { id: circular.id }, data: { status: 'PUBLISHED', publishedAt: new Date().toISOString() } });
    const recipients = await getRecipients(req.user.schoolId, updated.audience, updated.classId || undefined);
    const logs = await sendToRecipients(req.user.schoolId, recipients, updated.channels.split(','), updated.title, updated.message);
    return res.status(200).json({ success: true, message: `Published circular and created ${logs.length} delivery logs`, data: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error publishing circular' });
  }
};

export const sendManualMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const data = manualMessageSchema.parse(req.body);
    const recipients = await getRecipients(req.user.schoolId, data.audience, data.classId);
    const logs = await sendToRecipients(req.user.schoolId, recipients, data.channels, data.title, data.message);
    return res.status(200).json({ success: true, message: `Created ${logs.length} delivery logs`, data: logs });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: error.errors[0].message });
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error sending message' });
  }
};

export const getCommunicationLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const logs = await prisma.communicationLog.findMany({
      where: { schoolId: req.user.schoolId },
      include: { user: { select: { username: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error fetching communication logs' });
  }
};

export const registerPushDevice = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const data = deviceSchema.parse(req.body);
    const device = await prisma.pushDevice.upsert({
      where: { token: data.token },
      update: { userId: req.user.id, platform: data.platform, isActive: true },
      create: { userId: req.user.id, token: data.token, platform: data.platform },
    });
    return res.status(200).json({ success: true, data: device });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: error.errors[0].message });
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error registering push device' });
  }
};

export const verifyWhatsAppWebhook = async (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode !== 'subscribe' || !token || !challenge) return res.status(400).send('Invalid webhook verification request');
  const setting = await prisma.communicationSetting.findFirst({ where: { whatsappVerifyToken: String(token) } });
  if (!setting) return res.status(403).send('Verify token mismatch');
  return res.status(200).send(String(challenge));
};

export const receiveWhatsAppWebhook = async (req: Request, res: Response) => {
  try {
    const changes = req.body?.entry?.flatMap((entry: any) => entry.changes || []) || [];
    for (const change of changes) {
      const phoneNumberId = change.value?.metadata?.phone_number_id;
      const setting = phoneNumberId ? await prisma.communicationSetting.findFirst({ where: { whatsappPhoneNumberId: String(phoneNumberId) } }) : null;
      if (setting) {
        await prisma.communicationLog.create({
          data: {
            schoolId: setting.schoolId,
            recipient: change.value?.messages?.[0]?.from || 'WhatsApp webhook',
            channel: 'WHATSAPP',
            message: JSON.stringify(change.value).slice(0, 1000),
            status: 'SENT',
            sentAt: new Date().toISOString(),
          },
        });
      }
    }
    return res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error(error);
    return res.status(500).send('Webhook processing failed');
  }
};
