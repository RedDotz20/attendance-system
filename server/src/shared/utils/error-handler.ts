/**
 * Error handling utilities and custom error classes
 */

import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";
import type {
	ApiErrorResponse,
	ValidationError as ApiValidationError,
} from "@/shared/types/api.js";
import { ErrorCodes, HttpStatusCodes } from "@/shared/types/common.js";
import { logger } from "@/shared/utils/logger.js";

// Custom error classes for better error handling
export class AppError extends Error {
	public readonly code: string;
	public readonly statusCode: number;
	public readonly details?: Record<string, unknown> | undefined;

	constructor(
		message: string,
		code: string = ErrorCodes.INTERNAL_ERROR,
		statusCode: number = HttpStatusCodes.INTERNAL_SERVER_ERROR,
		details?: Record<string, unknown> | undefined
	) {
		super(message);
		this.name = this.constructor.name;
		this.code = code;
		this.statusCode = statusCode;
		this.details = details;

		// Maintains proper stack trace for where error was thrown
		Error.captureStackTrace(this, this.constructor);
	}
}

export class AppValidationError extends AppError {
	public readonly validationErrors: ApiValidationError[];

	constructor(message: string, validationErrors: ApiValidationError[] = []) {
		super(message, ErrorCodes.VALIDATION_ERROR, HttpStatusCodes.BAD_REQUEST);
		this.validationErrors = validationErrors;
	}
}

export class AuthenticationError extends AppError {
	constructor(message: string = "Authentication required") {
		super(message, ErrorCodes.UNAUTHORIZED, HttpStatusCodes.UNAUTHORIZED);
	}
}

export class AuthorizationError extends AppError {
	constructor(message: string = "Insufficient permissions") {
		super(message, ErrorCodes.FORBIDDEN, HttpStatusCodes.FORBIDDEN);
	}
}

export class NotFoundError extends AppError {
	constructor(resource: string = "Resource") {
		super(
			`${resource} not found`,
			ErrorCodes.NOT_FOUND,
			HttpStatusCodes.NOT_FOUND
		);
	}
}

export class ConflictError extends AppError {
	constructor(message: string) {
		super(message, ErrorCodes.CONFLICT, HttpStatusCodes.CONFLICT);
	}
}

export class DatabaseError extends AppError {
	constructor(message: string, details?: Record<string, unknown> | undefined) {
		super(
			message,
			ErrorCodes.DATABASE_ERROR,
			HttpStatusCodes.INTERNAL_SERVER_ERROR,
			details
		);
	}
}

// Error response formatter
export function formatErrorResponse(error: AppError): ApiErrorResponse {
	return {
		success: false,
		message: error.message,
		timestamp: new Date().toISOString(),
		error: {
			code: error.code,
			message: error.message,
			...(error.details && { details: error.details }),
		},
		...(error instanceof AppValidationError && {
			errors: error.validationErrors,
		}),
	};
}

// Global error handler for Hono
export function createErrorHandler() {
	return (error: Error, c: Context) => {
		// Log error for monitoring
		logger.error(
			{
				error: error.message,
				stack: error.stack,
				url: c.req.url,
				method: c.req.method,
			},
			"Application Error"
		);

		// Handle HTTPException from Hono
		if (error instanceof HTTPException) {
			return error.getResponse();
		}

		// Handle our custom AppError
		if (error instanceof AppError) {
			const response = formatErrorResponse(error);
			return c.json(response, error.statusCode as any);
		}

		// Handle unexpected errors
		const response: ApiErrorResponse = {
			success: false,
			message: "Internal Server Error",
			timestamp: new Date().toISOString(),
			error: {
				code: ErrorCodes.INTERNAL_ERROR,
				message: "An unexpected error occurred",
			},
		};

		return c.json(response, HttpStatusCodes.INTERNAL_SERVER_ERROR as any);
	};
}

// Async error wrapper for route handlers
export function asyncHandler<T extends unknown[]>(
	fn: (...args: T) => Promise<Response>
) {
	return (...args: T): Promise<Response> => {
		return fn(...args).catch((error: Error) => {
			// Re-throw to be handled by global error handler
			throw error;
		});
	};
}
