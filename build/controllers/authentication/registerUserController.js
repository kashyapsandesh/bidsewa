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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = void 0;
const appError_1 = require("../../utils/appError");
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs")); // Import bcrypt for hashing passwords
const prisma = new client_1.PrismaClient();
const createUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, phone, role, password, bankDetails, paymentMethodDetails, } = req.body;
        // Check for required fields
        if (!username || !email || !phone || !password || !role) {
            return next(new appError_1.AppError("Please provide all the required fields", 400));
        }
        // Check if user or phone already exists
        const userExists = yield prisma.user.findUnique({
            where: { email },
        });
        const phoneExists = yield prisma.user.findUnique({
            where: { phone },
        });
        if (userExists) {
            return next(new appError_1.AppError("User already exists", 400));
        }
        if (phoneExists) {
            return next(new appError_1.AppError("Phone number already exists", 400));
        }
        // Check if role is seller and bank details are provided
        if (role === "SELLER" && !bankDetails) {
            return next(new appError_1.AppError("Bank details must be provided for sellers", 400));
        }
        // Validate payment method details based on the selected payment method
        const { method } = paymentMethodDetails; // Extracting the payment method
        // Check if paymentMethodDetails is an object
        if (typeof paymentMethodDetails !== "object") {
            return next(new appError_1.AppError("Payment method details must be an object", 400));
        }
        console.log("came here");
        // Validate based on payment method
        if (method === "BANK") {
            // Check if bank details are provided
            if (!bankDetails ||
                !bankDetails.accountNumber ||
                !bankDetails.accountName ||
                !bankDetails.bankName) {
                return next(new appError_1.AppError("Bank details must be provided for BANK payment method", 400));
            }
        }
        else if (method === "ESEWA") {
            // Validate ESEWA details
            if (!paymentMethodDetails.esewaId) {
                return next(new appError_1.AppError("ESEWA ID must be provided for ESEWA payment method", 400));
            }
        }
        else if (method === "KHALTI") {
            // Validate KHALTI details
            if (!paymentMethodDetails.khaltiId) {
                return next(new appError_1.AppError("KHALTI ID must be provided for KHALTI payment method", 400));
            }
        }
        else {
            return next(new appError_1.AppError("Invalid payment method selected", 400));
        }
        // Hash the password before saving to the database
        const hashedPassword = yield bcryptjs_1.default.hash(password, 12);
        // Create new user
        const newUser = yield prisma.user.create({
            data: {
                username,
                email,
                phone,
                role,
                password: hashedPassword,
                dueCommission: 0,
                bankDetails: role === "SELLER" ? { create: bankDetails } : undefined,
                UserPaymentMethod: {
                    create: Object.assign(Object.assign(Object.assign({ method: paymentMethodDetails.method }, (paymentMethodDetails.method === "BANK"
                        ? { bankDetails: { create: bankDetails } }
                        : {})), (paymentMethodDetails.method === "ESEWA"
                        ? { esewaId: paymentMethodDetails.esewaId }
                        : {})), (paymentMethodDetails.method === "KHALTI"
                        ? { khaltiId: paymentMethodDetails.khaltiId }
                        : {})),
                },
            },
        });
        // Exclude the password from the response
        const { password: _ } = newUser, userResponse = __rest(newUser, ["password"]);
        return res.status(201).json({
            status: "success",
            message: "User created successfully",
            data: userResponse,
        });
    }
    catch (error) {
        // Handle specific Prisma errors
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                // Unique constraint failed
                return next(new appError_1.AppError("A user with this email or phone already exists.", 400));
            }
        }
        // Log the error for debugging
        console.error("Error in createUser:", error);
        // Fallback for any other error
        return next(new appError_1.AppError("An error occurred while creating the user", 500));
    }
});
exports.createUser = createUser;
