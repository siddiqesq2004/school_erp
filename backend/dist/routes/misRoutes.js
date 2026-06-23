"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const misController_1 = require("../controllers/misController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.protect);
router.get('/overview', misController_1.getMISDashboard);
exports.default = router;
