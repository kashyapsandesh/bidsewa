"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = exports.AppError = void 0;
// utils/appError.ts
class AppError extends Error {
    constructor(message, statusCode) {
        super(message); // Call the parent constructor
        this.statusCode = statusCode;
        this.status = true; // Default to operational
        Error.captureStackTrace(this, this.constructor); // Capture stack trace
    }
}
exports.AppError = AppError;
// You can also create specific error types by extending the AppError class
class ValidationError extends AppError {
    constructor(message) {
        super(message, 400); // 400 Bad Request
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends AppError {
    constructor(message) {
        super(message, 404); // 404 Not Found
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends AppError {
    constructor(message) {
        super(message, 401); // 401 Unauthorized
    }
}
exports.UnauthorizedError = UnauthorizedError;
// Add more specific error classes as needed...
