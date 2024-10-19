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
exports.changePassword = exports.resetpassword = exports.verifyOtp = exports.forgetpassword = exports.myInfo = exports.logoutUser = exports.loginUser = exports.createUser = void 0;
const appError_1 = require("../../utils/appError");
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs")); // Import bcrypt for hashing passwords
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken")); // Import jsonwebtoken for creating JWT tokens
const client_2 = require("@prisma/client");
const nodemailer_1 = __importDefault(require("nodemailer"));
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
const createUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, phone, role, plan, password, bankDetails, paymentMethodDetails, } = req.body;
        // Check for required fields
        if (!username || !email || !phone || !password || !role || !plan) {
            return next(new appError_1.AppError("Please provide all the required fields", 400));
        }
        // Validate the plan
        const validPlans = Object.values(client_2.Plan);
        if (!validPlans.includes(plan)) {
            return next(new appError_1.AppError(`Invalid plan: ${plan}`, 400));
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
        // if (role === "SELLER") {
        //   return next(
        //     new AppError("Bank details must be provided for sellers", 400)
        //   );
        // }
        // Validate payment method details based on the selected payment method
        const { method } = paymentMethodDetails; // Extracting the payment method
        // Check if paymentMethodDetails is an object
        if (typeof paymentMethodDetails !== "object") {
            return next(new appError_1.AppError("Payment method details must be an object", 400));
        }
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
        if ((role == "SELLER" || role == "INSPECTOR") && !plan) {
            return next(new appError_1.AppError("Plan must be provided for seller", 400));
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
                plan,
                password: hashedPassword,
                UserPaymentMethod: role == "SELLER" || role == "INSPECTOR"
                    ? {
                        create: Object.assign(Object.assign(Object.assign({ method: paymentMethodDetails.method }, (paymentMethodDetails.method === "BANK"
                            ? {
                                bankDetails: {
                                    create: {
                                        accountNumber: bankDetails.accountNumber,
                                        accountName: bankDetails.accountName,
                                        bankName: bankDetails.bankName,
                                        User: {
                                            connect: {
                                                email: email, // We're using email to connect the user, assuming it's unique
                                            },
                                        },
                                    },
                                },
                            }
                            : {})), (paymentMethodDetails.method === "ESEWA"
                            ? {
                                esewaDetails: {
                                    create: {
                                        esewaId: paymentMethodDetails.esewaId,
                                        User: {
                                            connect: {
                                                email: email, // We're using email to connect the user, assuming it's unique
                                            },
                                        },
                                    },
                                },
                            }
                            : {})), (paymentMethodDetails.method === "KHALTI"
                            ? {
                                khaltiDetails: {
                                    create: {
                                        khaltiId: paymentMethodDetails.khaltiId,
                                        User: {
                                            connect: {
                                                email: email, // We're using email to connect the user, assuming it's unique
                                            },
                                        },
                                    },
                                },
                            }
                            : {})),
                    }
                    : undefined,
            },
            include: {
                UserPaymentMethod: {
                    include: {
                        bankDetails: true,
                        esewaDetails: true,
                        khaltiDetails: true,
                    },
                },
                bankDetails: true,
            },
        });
        if (plan === "SubscriptionPlan") {
            const expiresAt = new Date(); // Get the current date
            expiresAt.setMonth(expiresAt.getMonth() + 1); // Add one month to the current date
            yield prisma.subscription.create({
                data: {
                    userId: newUser.id, // Connect the subscription to the user
                    plan: "FREE", // Set the plan type, you can change this if needed
                    expiresAt: expiresAt, // Set the expiration date to one month from now
                },
            });
        }
        if (plan == "CommissionBased") {
            yield prisma.commissionCharge.create({
                data: {
                    userId: newUser.id,
                    amount: 0,
                    sellCount: 0,
                },
            });
        }
        // Exclude the password from the response
        const { password: _ } = newUser, userResponse = __rest(newUser, ["password"]);
        return res.status(201).json({
            status: "success",
            message: "User created successfully",
            data: userResponse,
        });
    }
    catch (error) {
        console.error("Error in createUser:", error);
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
const loginUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, phone, password } = req.body;
    try {
        // Find user by email or phone using Prisma
        const user = yield prisma.user.findFirst({
            where: {
                OR: [{ email }, { phone }],
            },
        });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        // Check password
        const isPasswordValid = yield bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        // Create a JWT token
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, JWT_SECRET, {
            expiresIn: "1h", // Token expiration
        });
        console.log(user.role);
        console.log("Token:", token);
        // Set token in cookie
        res.cookie("token", token, {
            httpOnly: true, // Ensure the cookie is not accessible via JavaScript
            secure: process.env.NODE_ENV === "production", // Set to true in production
            maxAge: 3600000, // Cookie expiration time (1 hour)
        });
        // Return user data (excluding password)
        const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
        return res.json({ user: userWithoutPassword, token });
    }
    catch (error) {
        console.error("Error in loginUser:", error);
        return res.status(500).json({ message: "An error occurred" });
    }
});
exports.loginUser = loginUser;
const logoutUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.clearCookie("token");
        return res.json({ message: "Logged out successfully" });
    }
    catch (error) {
        console.error("Error in logoutUser:", error);
        return res.status(500).json({ message: "An error occurred" });
    }
});
exports.logoutUser = logoutUser;
const myInfo = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = yield prisma.user.findUnique({
            where: {
                id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
            },
            include: {
                UserPaymentMethod: {
                    include: {
                        bankDetails: true,
                    },
                },
                bankDetails: true,
            },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const { password: _ } = user, userResponse = __rest(user, ["password"]);
        return res.json({ user: userResponse });
    }
    catch (error) {
        console.error("Error in myInfo:", error);
        return res.status(500).json({ message: "An error occurred" });
    }
});
exports.myInfo = myInfo;
const forgetpassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    try {
        // Find the user by email
        const user = yield prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Generate a random 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generates a random 6-digit number
        // Set OTP expiration time (5 minutes from now)
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        // Check if a token already exists for the user
        const existingToken = yield prisma.passwordResetToken.findFirst({
            where: { userId: user.id }, // Use findFirst to search by userId
        });
        if (existingToken) {
            // If token exists, update it
            yield prisma.passwordResetToken.update({
                where: { id: existingToken.id }, // Use the existing token's ID
                data: {
                    token: otp,
                    // expiresAt: expiresAt,
                },
            });
        }
        else {
            // If no token exists, create a new one
            yield prisma.passwordResetToken.create({
                data: {
                    token: otp,
                    userId: user.id,
                    // expiresAt: expiresAt,
                },
            });
        }
        // Send email with the OTP
        const transporter = nodemailer_1.default.createTransport({
            service: "gmail",
            secure: true,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            },
        });
        const receiver = {
            from: "info@bidsewa.com.np",
            to: email,
            subject: "Reset Password OTP",
            text: `Your OTP for resetting your password is: ${otp}. It is valid for 5 minutes.`,
        };
        yield transporter.sendMail(receiver);
        return res.json({ message: "OTP sent successfully" });
    }
    catch (error) {
        console.error("Error in forgetpassword:", error);
        return res.status(500).json({ message: "An error occurred" });
    }
});
exports.forgetpassword = forgetpassword;
// Verify OTP for password reset
const verifyOtp = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { otp } = req.body; // Expecting OTP in the request body
        if (!otp) {
            return res.status(400).json({ message: "Please provide OTP" });
        }
        // Find the token record using the OTP
        const tokenRecord = yield prisma.passwordResetToken.findUnique({
            where: {
                token: otp, // Use the OTP to find the record
            },
        });
        // Check if token exists and is not expired
        if (!tokenRecord) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }
        // Check expiration time
        // const currentTime = new Date();
        // if (tokenRecord.expiresAt < currentTime) {
        //   return res.status(400).json({ message: "OTP has expired" });
        // }
        // OTP is valid
        return res.json({
            message: "OTP verified successfully",
            userId: tokenRecord.userId,
        });
    }
    catch (error) {
        console.error("Error in verifyOtp:", error);
        return res.status(500).json({ message: "An error occurred" });
    }
});
exports.verifyOtp = verifyOtp;
// Reset password after OTP verification
const resetpassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { otp, password } = req.body; // Expecting OTP and new password in the request body
        if (!otp || !password) {
            return res
                .status(400)
                .json({ message: "Please provide OTP and new password" });
        }
        // Find the token record using the OTP
        const tokenRecord = yield prisma.passwordResetToken.findUnique({
            where: {
                token: otp, // Use the OTP to find the record
            },
        });
        // Check if token exists and is not expired
        if (!tokenRecord) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }
        // Check expiration time
        // const currentTime = new Date();
        // if (tokenRecord.expiresAt < currentTime) {
        //   return res.status(400).json({ message: "OTP has expired" });
        // }
        // Find the user associated with the token
        const user = yield prisma.user.findUnique({
            where: {
                id: tokenRecord.userId, // Use the userId from the token record
            },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Hash the new password
        const hashedPassword = yield bcryptjs_1.default.hash(password, 12);
        // Update the user's password
        yield prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                password: hashedPassword,
            },
        });
        // Optionally delete the token record after use
        yield prisma.passwordResetToken.delete({
            where: {
                token: otp, // Delete the token record
            },
        });
        return res.json({ message: "Password updated successfully" });
    }
    catch (error) {
        console.error("Error in resetpassword:", error);
        return res.status(500).json({ message: "An error occurred" });
    }
});
exports.resetpassword = resetpassword;
// export const resetpassword = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { otp, password } = req.body; // Expecting OTP and new password in the request body
//     if (!otp || !password) {
//       return res.status(400).json({ message: "Please provide OTP and new password" });
//     }
//     // Find the token record using the OTP
//     const tokenRecord = await prisma.passwordResetToken.findUnique({
//       where: {
//         token: otp, // Use the OTP to find the record
//       },
//     });
//     // Check if token exists and if it has expired
//     if (!tokenRecord) {
//       return res.status(400).json({ message: "Invalid or expired OTP" });
//     }
//     // Check expiration time
//     // const currentTime = new Date();
//     // if (tokenRecord.expiresAt < currentTime) {
//     //   return res.status(400).json({ message: "OTP has expired" });
//     // }
//     // Find the user associated with the token
//     const user = await prisma.user.findUnique({
//       where: {
//         id: tokenRecord.userId, // Use the userId from the token record
//       },
//     });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     // Hash the new password
//     const hashedPassword = await bcrypt.hash(password, 12);
//     // Update the user's password
//     await prisma.user.update({
//       where: {
//         id: user.id,
//       },
//       data: {
//         password: hashedPassword,
//       },
//     });
//     // Optionally delete the token record after use
//     await prisma.passwordResetToken.delete({
//       where: {
//         token: otp, // Delete the token record
//       },
//     });
//     return res.json({ message: "Password updated successfully" });
//   } catch (error) {
//     console.error("Error in resetpassword:", error);
//     return res.status(500).json({ message: "An error occurred" });
//   }
// };
const changePassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, oldPassword, newPassword } = req.body;
        // Validate input
        if (!email || !oldPassword || !newPassword) {
            return res.status(400).json({ message: "All fields are required" });
        }
        // Find user by email
        const user = yield prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Check if old password is correct
        const isPasswordValid = yield bcryptjs_1.default.compare(oldPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid old password" });
        }
        // Ensure new password is sufficiently strong (you can enforce rules here)
        if (newPassword.length < 8) {
            return res
                .status(400)
                .json({ message: "Password must be at least 8 characters long" });
        }
        // Hash the new password
        const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 12);
        // Update the user's password in the database
        yield prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });
        return res.json({ message: "Password updated successfully" });
    }
    catch (error) {
        console.error("Error in changePassword:", error);
        return res.status(500).json({ message: "An error occurred" });
    }
});
exports.changePassword = changePassword;
