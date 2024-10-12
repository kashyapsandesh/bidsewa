// utils/appError.ts
export class AppError extends Error {
  public statusCode: number;
  public status: boolean; // Indicates if it's an operational error

  constructor(message: string, statusCode: number) {
    super(message); // Call the parent constructor
    this.statusCode = statusCode;
    this.status = true; // Default to operational
    Error.captureStackTrace(this, this.constructor); // Capture stack trace
  }
}

// You can also create specific error types by extending the AppError class
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400); // 400 Bad Request
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404); // 404 Not Found
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, 401); // 401 Unauthorized
  }
}

// Add more specific error classes as needed...
