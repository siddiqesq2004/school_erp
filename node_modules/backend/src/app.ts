import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import authRoutes from './routes/authRoutes';
import schoolRoutes from './routes/schoolRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import examRoutes from './routes/examRoutes';
import feeRoutes from './routes/feeRoutes';
import payrollRoutes from './routes/payrollRoutes';
import academicOpsRoutes from './routes/academicOpsRoutes';
import communicationRoutes from './routes/communicationRoutes';
import transportRoutes from './routes/transportRoutes';
import libraryRoutes from './routes/libraryRoutes';
import accountsRoutes from './routes/accountsRoutes';
import misRoutes from './routes/misRoutes';
import phase9Routes from './routes/phase9Routes';
import phase10Routes from './routes/phase10Routes';
import phase11Routes from './routes/phase11Routes';
import phase12Routes from './routes/phase12Routes';
import tnFocusRoutes from './routes/tnFocusRoutes';
import { globalRateLimit, authRateLimit } from './middlewares/rateLimitMiddleware';

const app = express();

// Security & performance middleware
app.use(helmet({ contentSecurityPolicy: false })); // Phase 11/12 system hardening
app.use(compression());                          // Phase 12 performance
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(globalRateLimit);

// Routes
app.use('/api/auth', authRateLimit, authRoutes);
app.use('/api/school', schoolRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/academic-ops', academicOpsRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/mis', misRoutes);
app.use('/api/phase9', phase9Routes);
app.use('/api/phase10', phase10Routes);
app.use('/api/phase11', phase11Routes);
app.use('/api/phase12', phase12Routes);
app.use('/api/tn', tnFocusRoutes);

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'School ERP Backend is healthy',
    phase: 'Phase 1-12 + Tamil Nadu Focus',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API documentation index
app.get('/api', (req: Request, res: Response) => {
  res.json({
    success: true,
    name: 'School ERP API',
    version: '1.0.0',
    modules: [
      'auth', 'school', 'attendance', 'exams', 'fees', 'payroll',
      'academic-ops', 'communication', 'transport', 'library',
      'accounts', 'mis', 'phase9', 'phase10',
      'phase11 (multi-branch, white-label, API gateway, analytics)',
      'phase12 (support portal, KB, video tutorials)',
      'tn (Samacheer Kalvi, Tamil templates, Aided grants)',
    ],
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

export default app;
