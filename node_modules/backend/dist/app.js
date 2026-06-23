"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const schoolRoutes_1 = __importDefault(require("./routes/schoolRoutes"));
const attendanceRoutes_1 = __importDefault(require("./routes/attendanceRoutes"));
const examRoutes_1 = __importDefault(require("./routes/examRoutes"));
const feeRoutes_1 = __importDefault(require("./routes/feeRoutes"));
const payrollRoutes_1 = __importDefault(require("./routes/payrollRoutes"));
const academicOpsRoutes_1 = __importDefault(require("./routes/academicOpsRoutes"));
const communicationRoutes_1 = __importDefault(require("./routes/communicationRoutes"));
const transportRoutes_1 = __importDefault(require("./routes/transportRoutes"));
const libraryRoutes_1 = __importDefault(require("./routes/libraryRoutes"));
const accountsRoutes_1 = __importDefault(require("./routes/accountsRoutes"));
const misRoutes_1 = __importDefault(require("./routes/misRoutes"));
const phase9Routes_1 = __importDefault(require("./routes/phase9Routes"));
const phase10Routes_1 = __importDefault(require("./routes/phase10Routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/school', schoolRoutes_1.default);
app.use('/api/attendance', attendanceRoutes_1.default);
app.use('/api/exams', examRoutes_1.default);
app.use('/api/fees', feeRoutes_1.default);
app.use('/api/payroll', payrollRoutes_1.default);
app.use('/api/academic-ops', academicOpsRoutes_1.default);
app.use('/api/communication', communicationRoutes_1.default);
app.use('/api/transport', transportRoutes_1.default);
app.use('/api/library', libraryRoutes_1.default);
app.use('/api/accounts', accountsRoutes_1.default);
app.use('/api/mis', misRoutes_1.default);
app.use('/api/phase9', phase9Routes_1.default);
app.use('/api/phase10', phase10Routes_1.default);
// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ success: true, message: 'Server is healthy' });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
    });
});
exports.default = app;
