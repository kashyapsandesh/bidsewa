"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.isAuthenticated = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const appError_1 = require("../../utils/appError"); // Custom error handling class
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const isAuthenticated = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const JWT_SECRET = process.env.JWT_SECRET;
    try {
        console.log("Checking if user is authenticated...");
        // Get token from Authorization header or cookies
        const token = ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1]) || req.cookies.token;
        // Check if token exists
        if (!token) {
            console.log("Token not found");
            return next(new appError_1.AppError("Unauthorized - Token not found", 401));
        }
        console.log("Token found:", token);
        // Verify the token
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Check if the user exists in the database
        const user = yield prisma.user.findUnique({
            where: {
                id: decoded.id,
            },
        });
        if (!user) {
            return next(new appError_1.AppError("Unauthorized - User not found", 401));
        }
        // Attach the user object to the request for use in next middleware/routes
        req.user = decoded;
        next(); // Proceed to the next middleware or route
    }
    catch (error) {
        console.error("Error in authMiddleware:", error);
        return next(new appError_1.AppError("Unauthorized - Invalid token", 401));
    }
});
exports.isAuthenticated = isAuthenticated;
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        var _a;
        console.log(`Role:${(_a = req.user) === null || _a === void 0 ? void 0 : _a.role}`);
        if (!req.user) {
            return next(new appError_1.AppError("Unauthorized - Not logged in", 401));
        }
        // Check if the user's role is in the allowed roles
        if (!roles.includes(req.user.role)) {
            return next(new appError_1.AppError("Forbidden - You do not have permission", 403));
        }
        next(); // Proceed if the user has the correct role
    };
};
exports.authorizeRoles = authorizeRoles;
