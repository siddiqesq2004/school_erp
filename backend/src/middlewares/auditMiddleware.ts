// ═══════════════════════════════════════════════════════════
// Audit Log Middleware (system hardening — Phase 11/12)
// ═══════════════════════════════════════════════════════════
import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from './authMiddleware';

interface AuditOptions {
  entity: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT' | 'CUSTOM';
  captureBody?: boolean;
}

export const auditLog = (opts: AuditOptions) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Capture original json
    const originalJson = res.json.bind(res);

    res.json = (body: any) => {
      // Best-effort async log; don't block response
      Promise.resolve().then(async () => {
        try {
          const statusCode = res.statusCode;
          if (statusCode >= 200 && statusCode < 300 && req.user) {
            await prisma.auditLog.create({
              data: {
                schoolId: req.user.schoolId,
                userId: req.user.id,
                action: opts.action,
                entity: opts.entity,
                entityId: req.params.id || (body?.data?.id ?? null),
                newValues: opts.captureBody ? JSON.stringify(req.body) : null,
                ip: req.ip || req.socket.remoteAddress || null,
                userAgent: req.get('user-agent') || null,
              },
            });
          }
        } catch (err) {
          console.error('Audit log failed:', err);
        }
      }).catch(() => {});

      return originalJson(body);
    };

    next();
  };
};

export async function writeAudit(
  schoolId: string,
  userId: string | null,
  action: string,
  entity: string,
  entityId: string | null,
  req?: Request,
  oldValues?: any,
  newValues?: any
) {
  try {
    await prisma.auditLog.create({
      data: {
        schoolId,
        userId: userId ?? null,
        action,
        entity,
        entityId: entityId ?? null,
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
        ip: req?.ip || null,
        userAgent: req?.get('user-agent') || null,
      },
    });
  } catch (err) {
    console.error('Audit write failed:', err);
  }
}
