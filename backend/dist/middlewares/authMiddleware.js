"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restrictTo = exports.protect = exports.Role = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../utils/prisma"));
var Role;
(function (Role) {
    Role["ADMIN"] = "ADMIN";
    Role["HOD"] = "HOD";
    Role["TEACHER"] = "TEACHER";
    Role["STAFF"] = "STAFF";
    Role["STUDENT"] = "STUDENT";
    Role["PARENT"] = "PARENT";
})(Role || (exports.Role = Role = {}));
const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, no token provided',
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret-key-12345');
        const user = await prisma_1.default.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, username: true, role: true, schoolId: true, status: true },
        });
        if (!user || user.status !== 'ACTIVE') {
            return res.status(401).json({
                success: false,
                message: 'User no longer exists or is inactive',
            });
        }
        req.user = {
            id: user.id,
            username: user.username,
            role: user.role,
            schoolId: user.schoolId,
        };
        next();
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, token failed',
        });
    }
};
exports.protect = protect;
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action',
            });
        }
        next();
    };
};
exports.restrictTo = restrictTo;
