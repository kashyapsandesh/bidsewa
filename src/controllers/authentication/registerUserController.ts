import { Request, Response, NextFunction } from "express";
import { AppError } from "../../utils/appError";
import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs"; // Import bcrypt for hashing passwords

const prisma = new PrismaClient();

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      username,
      email,
      phone,
      role,
      password,
      bankDetails,
      paymentMethodDetails,
    } = req.body;

    // Check for required fields
    if (!username || !email || !phone || !password || !role) {
      return next(new AppError("Please provide all the required fields", 400));
    }

    // Check if user or phone already exists
    const userExists = await prisma.user.findUnique({
      where: { email },
    });
    const phoneExists = await prisma.user.findUnique({
      where: { phone },
    });

    if (userExists) {
      return next(new AppError("User already exists", 400));
    }
    if (phoneExists) {
      return next(new AppError("Phone number already exists", 400));
    }

    // Check if role is seller and bank details are provided
    if (role === "SELLER" && !bankDetails) {
      return next(
        new AppError("Bank details must be provided for sellers", 400)
      );
    }

    // Validate payment method details based on the selected payment method
    const { method } = paymentMethodDetails; // Extracting the payment method

    // Check if paymentMethodDetails is an object
    if (typeof paymentMethodDetails !== "object") {
      return next(
        new AppError("Payment method details must be an object", 400)
      );
    }

    // Validate based on payment method
    if (method === "BANK") {
      // Check if bank details are provided
      if (
        !bankDetails ||
        !bankDetails.accountNumber ||
        !bankDetails.accountName ||
        !bankDetails.bankName
      ) {
        return next(
          new AppError(
            "Bank details must be provided for BANK payment method",
            400
          )
        );
      }
    } else if (method === "ESEWA") {
      // Validate ESEWA details
      if (!paymentMethodDetails.esewaId) {
        return next(
          new AppError(
            "ESEWA ID must be provided for ESEWA payment method",
            400
          )
        );
      }
    } else if (method === "KHALTI") {
      // Validate KHALTI details
      if (!paymentMethodDetails.khaltiId) {
        return next(
          new AppError(
            "KHALTI ID must be provided for KHALTI payment method",
            400
          )
        );
      }
    } else {
      return next(new AppError("Invalid payment method selected", 400));
    }

    // Hash the password before saving to the database
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        phone,
        role,
        password: hashedPassword,

        UserPaymentMethod:
          role == "SELLER" || role == "INSPECTOR"
            ? {
                create: {
                  method: paymentMethodDetails.method,
                  ...(paymentMethodDetails.method === "BANK"
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
                    : {}),
                  ...(paymentMethodDetails.method === "ESEWA"
                    ? { esewaId: paymentMethodDetails.esewaId }
                    : {}),
                  ...(paymentMethodDetails.method === "KHALTI"
                    ? { khaltiId: paymentMethodDetails.khaltiId }
                    : {}),
                },
              }
            : undefined,
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

    // Exclude the password from the response
    const { password: _, ...userResponse } = newUser;

    return res.status(201).json({
      status: "success",
      message: "User created successfully",
      data: userResponse,
    });
  } catch (error: any) {
    console.error("Error in createUser:", error);

    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        // Unique constraint failed
        return next(
          new AppError("A user with this email or phone already exists.", 400)
        );
      }
    }

    // Log the error for debugging
    console.error("Error in createUser:", error);

    // Fallback for any other error
    return next(new AppError("An error occurred while creating the user", 500));
  }
};
