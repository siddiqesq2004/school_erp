"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.receiveWhatsAppWebhook = exports.verifyWhatsAppWebhook = exports.registerPushDevice = exports.getCommunicationLogs = exports.sendManualMessage = exports.publishCircular = exports.getCirculars = exports.createCircular = exports.updateCommunicationSettings = exports.getCommunicationSettings = void 0;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../utils/prisma"));
const settingSchema = zod_1.z.object({
    whatsappEnabled: zod_1.z.boolean().optional(),
    whatsappPhoneNumberId: zod_1.z.string().optional(),
    whatsappBusinessId: zod_1.z.string().optional(),
    whatsappAccessToken: zod_1.z.string().optional(),
    whatsappVerifyToken: zod_1.z.string().optional(),
    pushEnabled: zod_1.z.boolean().optional(),
    firebaseProjectId: zod_1.z.string().optional(),
    firebaseWebApiKey: zod_1.z.string().optional(),
    firebaseVapidKey: zod_1.z.string().optional(),
    simulationMode: zod_1.z.boolean().optional(),
});
const circularSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    message: zod_1.z.string().min(1),
    audience: zod_1.z.enum(['ALL', 'STAFF', 'PARENTS', 'STUDENTS', 'CLASS']).default('ALL'),
    channels: zod_1.z.array(zod_1.z.enum(['PORTAL', 'WHATSAPP', 'PUSH'])).default(['PORTAL']),
    classId: zod_1.z.string().optional(),
    sectionId: zod_1.z.string().optional(),
    status: zod_1.z.enum(['DRAFT', 'PUBLISHED']).optional(),
});
const deviceSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
    platform: zod_1.z.enum(['WEB', 'ANDROID', 'IOS']).default('WEB'),
});
const manualMessageSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
    message: zod_1.z.string().min(1),
    channels: zod_1.z.array(zod_1.z.enum(['WHATSAPP', 'PUSH', 'PORTAL'])).min(1),
    audience: zod_1.z.enum(['ALL', 'STAFF', 'PARENTS', 'STUDENTS', 'CLASS']).default('ALL'),
    classId: zod_1.z.string().optional(),
});
const getRecipients = async (schoolId, audience, classId) => {
    if (audience === 'STAFF') {
        const staff = await prisma_1.default.staffProfile.findMany({ where: { user: { schoolId, status: 'ACTIVE' } }, include: { user: true } });
        return staff.map((item) => ({ userId: item.userId, name: `${item.firstName} ${item.lastName}`, phone: item.phone || '', role: item.user.role }));
    }
    const students = await prisma_1.default.studentProfile.findMany({
        where: { user: { schoolId }, ...(audience === 'CLASS' && classId ? { classId } : {}) },
        include: { user: true, parents: { include: { user: true } } },
    });
    if (audience === 'STUDENTS') {
        return students.map((item) => ({ userId: item.userId, name: `${item.firstName} ${item.lastName}`, phone: item.guardianPhone || '', role: 'STUDENT' }));
    }
    const parents = students.flatMap((student) => student.parents.map((parent) => ({ userId: parent.userId, name: parent.name, phone: parent.phone, role: 'PARENT' })));
    if (audience === 'PARENTS' || audience === 'CLASS')
        return parents;
    return [
        ...students.map((item) => ({ userId: item.userId, name: `${item.firstName} ${item.lastName}`, phone: item.guardianPhone || '', role: 'STUDENT' })),
        ...parents,
    ];
};
const logDelivery = async (schoolId, userId, recipient, channel, title, message, status = 'SIMULATED', errorMessage) => prisma_1.default.communicationLog.create({
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
const sendToRecipients = async (schoolId, recipients, channels, title, message) => {
    const setting = await prisma_1.default.communicationSetting.findUnique({ where: { schoolId } });
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
const getCommunicationSettings = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const settings = await prisma_1.default.communicationSetting.upsert({
            where: { schoolId: req.user.schoolId },
            update: {},
            create: { schoolId: req.user.schoolId, simulationMode: true },
        });
        return res.status(200).json({ success: true, data: settings });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching communication settings' });
    }
};
exports.getCommunicationSettings = getCommunicationSettings;
const updateCommunicationSettings = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = settingSchema.parse(req.body);
        const settings = await prisma_1.default.communicationSetting.upsert({
            where: { schoolId: req.user.schoolId },
            update: data,
            create: { schoolId: req.user.schoolId, ...data },
        });
        return res.status(200).json({ success: true, data: settings });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: error.errors[0].message });
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error saving communication settings' });
    }
};
exports.updateCommunicationSettings = updateCommunicationSettings;
const createCircular = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = circularSchema.parse(req.body);
        const circular = await prisma_1.default.circular.create({
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: error.errors[0].message });
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error creating circular' });
    }
};
exports.createCircular = createCircular;
const getCirculars = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const circulars = await prisma_1.default.circular.findMany({
            where: { schoolId: req.user.schoolId },
            include: { class: true, section: true },
            orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json({ success: true, data: circulars });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching circulars' });
    }
};
exports.getCirculars = getCirculars;
const publishCircular = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const circular = await prisma_1.default.circular.findFirst({ where: { id: req.params.circularId, schoolId: req.user.schoolId } });
        if (!circular)
            return res.status(404).json({ success: false, message: 'Circular not found' });
        const updated = await prisma_1.default.circular.update({ where: { id: circular.id }, data: { status: 'PUBLISHED', publishedAt: new Date().toISOString() } });
        const recipients = await getRecipients(req.user.schoolId, updated.audience, updated.classId || undefined);
        const logs = await sendToRecipients(req.user.schoolId, recipients, updated.channels.split(','), updated.title, updated.message);
        return res.status(200).json({ success: true, message: `Published circular and created ${logs.length} delivery logs`, data: updated });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error publishing circular' });
    }
};
exports.publishCircular = publishCircular;
const sendManualMessage = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = manualMessageSchema.parse(req.body);
        const recipients = await getRecipients(req.user.schoolId, data.audience, data.classId);
        const logs = await sendToRecipients(req.user.schoolId, recipients, data.channels, data.title, data.message);
        return res.status(200).json({ success: true, message: `Created ${logs.length} delivery logs`, data: logs });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: error.errors[0].message });
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error sending message' });
    }
};
exports.sendManualMessage = sendManualMessage;
const getCommunicationLogs = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const logs = await prisma_1.default.communicationLog.findMany({
            where: { schoolId: req.user.schoolId },
            include: { user: { select: { username: true, role: true } } },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
        return res.status(200).json({ success: true, data: logs });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching communication logs' });
    }
};
exports.getCommunicationLogs = getCommunicationLogs;
const registerPushDevice = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = deviceSchema.parse(req.body);
        const device = await prisma_1.default.pushDevice.upsert({
            where: { token: data.token },
            update: { userId: req.user.id, platform: data.platform, isActive: true },
            create: { userId: req.user.id, token: data.token, platform: data.platform },
        });
        return res.status(200).json({ success: true, data: device });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: error.errors[0].message });
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error registering push device' });
    }
};
exports.registerPushDevice = registerPushDevice;
const verifyWhatsAppWebhook = async (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode !== 'subscribe' || !token || !challenge)
        return res.status(400).send('Invalid webhook verification request');
    const setting = await prisma_1.default.communicationSetting.findFirst({ where: { whatsappVerifyToken: String(token) } });
    if (!setting)
        return res.status(403).send('Verify token mismatch');
    return res.status(200).send(String(challenge));
};
exports.verifyWhatsAppWebhook = verifyWhatsAppWebhook;
const receiveWhatsAppWebhook = async (req, res) => {
    try {
        const changes = req.body?.entry?.flatMap((entry) => entry.changes || []) || [];
        for (const change of changes) {
            const phoneNumberId = change.value?.metadata?.phone_number_id;
            const setting = phoneNumberId ? await prisma_1.default.communicationSetting.findFirst({ where: { whatsappPhoneNumberId: String(phoneNumberId) } }) : null;
            if (setting) {
                await prisma_1.default.communicationLog.create({
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).send('Webhook processing failed');
    }
};
exports.receiveWhatsAppWebhook = receiveWhatsAppWebhook;
