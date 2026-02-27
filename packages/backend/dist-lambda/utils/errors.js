/**
 * Custom error classes
 */
export class AppError extends Error {
    statusCode;
    code;
    details;
    constructor(statusCode, code, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}
export class NotFoundError extends AppError {
    constructor(resource, id) {
        super(404, 'NOT_FOUND', id ? `${resource} with id ${id} not found` : `${resource} not found`);
        this.name = 'NotFoundError';
    }
}
export class ValidationError extends AppError {
    constructor(message, details) {
        super(400, 'VALIDATION_ERROR', message, details);
        this.name = 'ValidationError';
    }
}
export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(401, 'UNAUTHORIZED', message);
        this.name = 'UnauthorizedError';
    }
}
export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(403, 'FORBIDDEN', message);
        this.name = 'ForbiddenError';
    }
}
export class ConflictError extends AppError {
    constructor(message, details) {
        super(409, 'CONFLICT', message, details);
        this.name = 'ConflictError';
    }
}
export class InternalServerError extends AppError {
    constructor(message = 'Internal server error', details) {
        super(500, 'INTERNAL_SERVER_ERROR', message, details);
        this.name = 'InternalServerError';
    }
}
export class ExternalServiceError extends AppError {
    constructor(service, message, details) {
        super(502, 'EXTERNAL_SERVICE_ERROR', `${service}: ${message}`, details);
        this.name = 'ExternalServiceError';
    }
}
//# sourceMappingURL=errors.js.map