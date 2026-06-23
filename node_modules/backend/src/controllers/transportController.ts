import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthenticatedRequest, Role } from '../middlewares/authMiddleware';

const vehicleSchema = z.object({
  registrationNumber: z.string().min(1, 'Registration number is required'),
  make: z.string().min(1, 'Vehicle make is required'),
  model: z.string().optional(),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  insuranceExpiry: z.string().optional(),
  fitnessExpiry: z.string().optional(),
  driverId: z.string().optional(),
});

const routeSchema = z.object({
  name: z.string().min(1, 'Route name is required'),
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
  stops: z.array(
    z.object({
      sequence: z.number().int().min(1),
      name: z.string().min(1),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      estimatedTime: z.string().optional(),
    })
  ),
});

const allocationSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  routeId: z.string().min(1, 'Route ID is required'),
  stopId: z.string().optional(),
  active: z.boolean().optional().default(true),
});

const gpsSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  latitude: z.number(),
  longitude: z.number(),
  recordedAt: z.string().optional(),
});

export const createVehicle = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const data = vehicleSchema.parse(req.body);

    if (data.driverId) {
      const driver = await prisma.staffProfile.findFirst({ where: { id: data.driverId, user: { schoolId: req.user.schoolId } } });
      if (!driver) return res.status(404).json({ success: false, message: 'Driver not found for this school' });
    }

    const vehicle = await prisma.transportVehicle.create({
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
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: error.errors[0].message });
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error creating transport vehicle' });
  }
};

export const getVehicles = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const vehicles = await prisma.transportVehicle.findMany({
      where: { schoolId: req.user.schoolId },
      include: { driver: { select: { id: true, firstName: true, lastName: true, employeeCode: true } } },
      orderBy: { registrationNumber: 'asc' },
    });
    return res.status(200).json({ success: true, data: vehicles });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error fetching transport vehicles' });
  }
};

export const createRoute = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const data = routeSchema.parse(req.body);

    if (data.vehicleId) {
      const vehicle = await prisma.transportVehicle.findFirst({ where: { id: data.vehicleId, schoolId: req.user.schoolId } });
      if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found for this school' });
    }

    if (data.driverId) {
      const driver = await prisma.staffProfile.findFirst({ where: { id: data.driverId, user: { schoolId: req.user.schoolId } } });
      if (!driver) return res.status(404).json({ success: false, message: 'Driver not found for this school' });
    }

    const route = await prisma.transportRoute.create({
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
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: error.errors[0].message });
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error creating transport route' });
  }
};

export const getRoutes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const routes = await prisma.transportRoute.findMany({
      where: { schoolId: req.user.schoolId },
      include: {
        vehicle: true,
        driver: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        stops: { orderBy: { sequence: 'asc' } },
      },
      orderBy: { name: 'asc' },
    });
    return res.status(200).json({ success: true, data: routes });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error fetching transport routes' });
  }
};

export const assignStudentRoute = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const data = allocationSchema.parse(req.body);

    const student = await prisma.studentProfile.findFirst({ where: { id: data.studentId, user: { schoolId: req.user.schoolId } } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found for this school' });

    const route = await prisma.transportRoute.findFirst({ where: { id: data.routeId, schoolId: req.user.schoolId } });
    if (!route) return res.status(404).json({ success: false, message: 'Route not found for this school' });

    if (data.stopId) {
      const stop = await prisma.transportStop.findFirst({ where: { id: data.stopId, routeId: data.routeId } });
      if (!stop) return res.status(404).json({ success: false, message: 'Stop not found for this route' });
    }

    const existingAllocation = await prisma.transportAllocation.findFirst({ where: { studentId: data.studentId } });

    const allocation = existingAllocation
      ? await prisma.transportAllocation.update({
          where: { id: existingAllocation.id },
          data: {
            routeId: data.routeId,
            stopId: data.stopId,
            active: data.active,
          },
        })
      : await prisma.transportAllocation.create({
          data: {
            studentId: data.studentId,
            routeId: data.routeId,
            stopId: data.stopId,
            active: data.active,
          },
        });

    return res.status(200).json({ success: true, data: allocation });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: error.errors[0].message });
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error assigning student transport route' });
  }
};

export const getAllocations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const allocations = await prisma.transportAllocation.findMany({
      where: { route: { schoolId: req.user.schoolId } },
      include: {
        student: true,
        route: true,
        stop: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ success: true, data: allocations });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error fetching transport allocations' });
  }
};

export const addGPSLocation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const data = gpsSchema.parse(req.body);

    const vehicle = await prisma.transportVehicle.findFirst({ where: { id: data.vehicleId, schoolId: req.user.schoolId } });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found for this school' });

    const location = await prisma.gPSLocation.create({
      data: {
        vehicleId: data.vehicleId,
        latitude: data.latitude,
        longitude: data.longitude,
        recordedAt: data.recordedAt ? new Date(data.recordedAt) : new Date(),
      },
    });

    return res.status(201).json({ success: true, data: location });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: error.errors[0].message });
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error recording GPS location' });
  }
};

export const getLatestGPSLocation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    const { vehicleId } = req.query as { vehicleId?: string };
    if (!vehicleId) return res.status(400).json({ success: false, message: 'vehicleId query parameter is required' });

    const vehicle = await prisma.transportVehicle.findFirst({ where: { id: vehicleId, schoolId: req.user.schoolId } });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found for this school' });

    const latest = await prisma.gPSLocation.findFirst({
      where: { vehicleId },
      orderBy: { recordedAt: 'desc' },
    });
    return res.status(200).json({ success: true, data: latest });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error fetching latest GPS location' });
  }
};
