"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatestGPSLocation = exports.addGPSLocation = exports.getAllocations = exports.assignStudentRoute = exports.getRoutes = exports.createRoute = exports.getVehicles = exports.createVehicle = void 0;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../utils/prisma"));
const vehicleSchema = zod_1.z.object({
    registrationNumber: zod_1.z.string().min(1, 'Registration number is required'),
    make: zod_1.z.string().min(1, 'Vehicle make is required'),
    model: zod_1.z.string().optional(),
    capacity: zod_1.z.number().int().min(1, 'Capacity must be at least 1'),
    insuranceExpiry: zod_1.z.string().optional(),
    fitnessExpiry: zod_1.z.string().optional(),
    driverId: zod_1.z.string().optional(),
});
const routeSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Route name is required'),
    vehicleId: zod_1.z.string().optional(),
    driverId: zod_1.z.string().optional(),
    stops: zod_1.z.array(zod_1.z.object({
        sequence: zod_1.z.number().int().min(1),
        name: zod_1.z.string().min(1),
        latitude: zod_1.z.number().optional(),
        longitude: zod_1.z.number().optional(),
        estimatedTime: zod_1.z.string().optional(),
    })),
});
const allocationSchema = zod_1.z.object({
    studentId: zod_1.z.string().min(1, 'Student ID is required'),
    routeId: zod_1.z.string().min(1, 'Route ID is required'),
    stopId: zod_1.z.string().optional(),
    active: zod_1.z.boolean().optional().default(true),
});
const gpsSchema = zod_1.z.object({
    vehicleId: zod_1.z.string().min(1, 'Vehicle ID is required'),
    latitude: zod_1.z.number(),
    longitude: zod_1.z.number(),
    recordedAt: zod_1.z.string().optional(),
});
const createVehicle = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = vehicleSchema.parse(req.body);
        if (data.driverId) {
            const driver = await prisma_1.default.staffProfile.findFirst({ where: { id: data.driverId, user: { schoolId: req.user.schoolId } } });
            if (!driver)
                return res.status(404).json({ success: false, message: 'Driver not found for this school' });
        }
        const vehicle = await prisma_1.default.transportVehicle.create({
            data: {
                schoolId: req.user.schoolId,
                registrationNumber: data.registrationNumber,
                make: data.make,
                model: data.model,
                capacity: data.capacity,
                insuranceExpiry: data.insuranceExpiry,
                fitnessExpiry: data.fitnessExpiry,
                driverId: data.driverId,
            },
        });
        return res.status(201).json({ success: true, data: vehicle });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: error.errors[0].message });
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error creating transport vehicle' });
    }
};
exports.createVehicle = createVehicle;
const getVehicles = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const vehicles = await prisma_1.default.transportVehicle.findMany({
            where: { schoolId: req.user.schoolId },
            include: { driver: { select: { id: true, firstName: true, lastName: true, employeeCode: true } } },
            orderBy: { registrationNumber: 'asc' },
        });
        return res.status(200).json({ success: true, data: vehicles });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching transport vehicles' });
    }
};
exports.getVehicles = getVehicles;
const createRoute = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = routeSchema.parse(req.body);
        if (data.vehicleId) {
            const vehicle = await prisma_1.default.transportVehicle.findFirst({ where: { id: data.vehicleId, schoolId: req.user.schoolId } });
            if (!vehicle)
                return res.status(404).json({ success: false, message: 'Vehicle not found for this school' });
        }
        if (data.driverId) {
            const driver = await prisma_1.default.staffProfile.findFirst({ where: { id: data.driverId, user: { schoolId: req.user.schoolId } } });
            if (!driver)
                return res.status(404).json({ success: false, message: 'Driver not found for this school' });
        }
        const route = await prisma_1.default.transportRoute.create({
            data: {
                schoolId: req.user.schoolId,
                name: data.name,
                vehicleId: data.vehicleId,
                driverId: data.driverId,
                stops: {
                    create: data.stops.map((stop) => ({
                        sequence: stop.sequence,
                        name: stop.name,
                        latitude: stop.latitude,
                        longitude: stop.longitude,
                        estimatedTime: stop.estimatedTime,
                    })),
                },
            },
            include: { stops: true },
        });
        return res.status(201).json({ success: true, data: route });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: error.errors[0].message });
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error creating transport route' });
    }
};
exports.createRoute = createRoute;
const getRoutes = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const routes = await prisma_1.default.transportRoute.findMany({
            where: { schoolId: req.user.schoolId },
            include: {
                vehicle: true,
                driver: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
                stops: { orderBy: { sequence: 'asc' } },
            },
            orderBy: { name: 'asc' },
        });
        return res.status(200).json({ success: true, data: routes });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching transport routes' });
    }
};
exports.getRoutes = getRoutes;
const assignStudentRoute = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = allocationSchema.parse(req.body);
        const student = await prisma_1.default.studentProfile.findFirst({ where: { id: data.studentId, user: { schoolId: req.user.schoolId } } });
        if (!student)
            return res.status(404).json({ success: false, message: 'Student not found for this school' });
        const route = await prisma_1.default.transportRoute.findFirst({ where: { id: data.routeId, schoolId: req.user.schoolId } });
        if (!route)
            return res.status(404).json({ success: false, message: 'Route not found for this school' });
        if (data.stopId) {
            const stop = await prisma_1.default.transportStop.findFirst({ where: { id: data.stopId, routeId: data.routeId } });
            if (!stop)
                return res.status(404).json({ success: false, message: 'Stop not found for this route' });
        }
        const existingAllocation = await prisma_1.default.transportAllocation.findFirst({ where: { studentId: data.studentId } });
        const allocation = existingAllocation
            ? await prisma_1.default.transportAllocation.update({
                where: { id: existingAllocation.id },
                data: {
                    routeId: data.routeId,
                    stopId: data.stopId,
                    active: data.active,
                },
            })
            : await prisma_1.default.transportAllocation.create({
                data: {
                    studentId: data.studentId,
                    routeId: data.routeId,
                    stopId: data.stopId,
                    active: data.active,
                },
            });
        return res.status(200).json({ success: true, data: allocation });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: error.errors[0].message });
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error assigning student transport route' });
    }
};
exports.assignStudentRoute = assignStudentRoute;
const getAllocations = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const allocations = await prisma_1.default.transportAllocation.findMany({
            where: { route: { schoolId: req.user.schoolId } },
            include: {
                student: true,
                route: true,
                stop: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json({ success: true, data: allocations });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching transport allocations' });
    }
};
exports.getAllocations = getAllocations;
const addGPSLocation = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const data = gpsSchema.parse(req.body);
        const vehicle = await prisma_1.default.transportVehicle.findFirst({ where: { id: data.vehicleId, schoolId: req.user.schoolId } });
        if (!vehicle)
            return res.status(404).json({ success: false, message: 'Vehicle not found for this school' });
        const location = await prisma_1.default.gPSLocation.create({
            data: {
                vehicleId: data.vehicleId,
                latitude: data.latitude,
                longitude: data.longitude,
                recordedAt: data.recordedAt ? new Date(data.recordedAt) : new Date(),
            },
        });
        return res.status(201).json({ success: true, data: location });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, message: error.errors[0].message });
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error recording GPS location' });
    }
};
exports.addGPSLocation = addGPSLocation;
const getLatestGPSLocation = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const { vehicleId } = req.query;
        if (!vehicleId)
            return res.status(400).json({ success: false, message: 'vehicleId query parameter is required' });
        const vehicle = await prisma_1.default.transportVehicle.findFirst({ where: { id: vehicleId, schoolId: req.user.schoolId } });
        if (!vehicle)
            return res.status(404).json({ success: false, message: 'Vehicle not found for this school' });
        const latest = await prisma_1.default.gPSLocation.findFirst({
            where: { vehicleId },
            orderBy: { recordedAt: 'desc' },
        });
        return res.status(200).json({ success: true, data: latest });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching latest GPS location' });
    }
};
exports.getLatestGPSLocation = getLatestGPSLocation;
