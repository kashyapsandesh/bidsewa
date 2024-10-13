import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../../utils/appError"; // Custom error handling class
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface DecodedToken {
  id: number; // User ID from token
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken; // Add user property to the Request interface
    }
  }
}

export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const JWT_SECRET = process.env.JWT_SECRET as string;

  try {
    console.log("Checking if user is authenticated...");
    // Get token from Authorization header or cookies
    const token = req.headers.authorization?.split(" ")[1] || req.cookies.token;

    // Check if token exists
    if (!token) {
      console.log("Token not found");
      return next(new AppError("Unauthorized - Token not found", 401));
    }
    console.log("Token found:", token);

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    console.log("Role:", decoded.role);
    // Check if the user exists in the database
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
    });

    if (!user) {
      return next(new AppError("Unauthorized - User not found", 401));
    }

    // Attach the user object to the request for use in next middleware/routes
    req.user = decoded;

    next(); // Proceed to the next middleware or route
  } catch (error) {
    console.error("Error in authMiddleware:", error);
    return next(new AppError("Unauthorized - Invalid token", 401));
  }
};
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log(`Role:${req.user?.role}`);
    if (!req.user) {
      return next(new AppError("Unauthorized - Not logged in", 401));
    }

    // Check if the user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      return next(new AppError("Forbidden - You do not have permission", 403));
    }

    next(); // Proceed if the user has the correct role
  };
};
