// middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/appError";

const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
  // Set default values for statusCode and message if not set
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  // Log the error (consider using a logging library)
  console.error(err); // Log the error for debugging

  // Send JSON response
  return res.status(err.statusCode).json({
    status: "error",
    statusCode: err.statusCode,
    message: err.message,
  });
};

export default errorHandler;
