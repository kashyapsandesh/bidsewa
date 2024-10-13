import { Request, Response, NextFunction } from "express";
import { AppError } from "../../utils/appError";
import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs"; // Import bcrypt for hashing passwords
import jwt from "jsonwebtoken"; // Import jsonwebtoken for creating JWT tokens

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET as string;
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
    // if (role === "SELLER") {
    //   return next(
    //     new AppError("Bank details must be provided for sellers", 400)
    //   );
    // }

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
                    : {}),
                  ...(paymentMethodDetails.method === "KHALTI"
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
                    : {}),
                },
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

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, phone, password } = req.body;
  try {
    // Find user by email or phone using Prisma
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    // Create a JWT token
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
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
    const { password: _, ...userWithoutPassword } = user;
    return res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error("Error in loginUser:", error);
    return res.status(500).json({ message: "An error occurred" });
  }
};

export const logoutUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.clearCookie("token");
    return res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logoutUser:", error);
    return res.status(500).json({ message: "An error occurred" });
  }
};
export const myInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user?.id,
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
    const { password: _, ...userResponse } = user;
    return res.json({ user: userResponse });
  } catch (error) {
    console.error("Error in myInfo:", error);
    return res.status(500).json({ message: "An error occurred" });
  }
};
