/**
 * Response utilities for consistent API responses
 */

import type { Context } from "hono";
import type {
	ApiSuccessResponse,
	ApiErrorResponse,
	PaginatedResponse,
} from "@/shared/types/api.js";
import { HttpStatusCodes } from "@/shared/types/common.js";

// Success response helper
export function success<T>(
	c: Context,
	data: T,
	message?: string,
	statusCode: number = HttpStatusCodes.OK
): Response {
	const response: ApiSuccessResponse<T> = {
		success: true,
		data,
		timestamp: new Date().toISOString(),
		...(message && { message }),
	};

	return c.json(response, statusCode as any);
}

// Created response helper
export function created<T>(c: Context, data: T, message?: string): Response {
	return success(c, data, message, HttpStatusCodes.CREATED);
}

// No content response helper
export function noContent(c: Context): Response {
	return c.body(null, HttpStatusCodes.NO_CONTENT);
}

// Error response helper
export function error(
	c: Context,
	message: string,
	code: string,
	statusCode: number = HttpStatusCodes.BAD_REQUEST,
	details?: Record<string, unknown>
): Response {
	const response: ApiErrorResponse = {
		success: false,
		message,
		timestamp: new Date().toISOString(),
		error: {
			code,
			message,
			...(details && { details }),
		},
	};

	return c.json(response, statusCode as any);
}

// Paginated response helper
export function paginated<T>(
	c: Context,
	data: T[],
	currentPage: number,
	totalItems: number,
	itemsPerPage: number,
	message?: string
): Response {
	const totalPages = Math.ceil(totalItems / itemsPerPage);

	const response: ApiSuccessResponse<PaginatedResponse<T>> = {
		success: true,
		data: {
			data,
			pagination: {
				currentPage,
				totalPages,
				totalItems,
				itemsPerPage,
				hasNextPage: currentPage < totalPages,
				hasPrevPage: currentPage > 1,
			},
		},
		timestamp: new Date().toISOString(),
		...(message && { message }),
	};

	return c.json(response, HttpStatusCodes.OK as any);
}

// Validation error response helper
export function validationError(
	c: Context,
	errors: Array<{ field: string; message: string; code: string }>,
	message: string = "Validation failed"
): Response {
	const response: ApiErrorResponse = {
		success: false,
		message,
		timestamp: new Date().toISOString(),
		error: {
			code: "VALIDATION_ERROR",
			message,
		},
		errors,
	};

	return c.json(response, HttpStatusCodes.BAD_REQUEST as any);
}

// Not found response helper
export function notFound(
	c: Context,
	resource: string = "Resource",
	message?: string
): Response {
	return error(
		c,
		message || `${resource} not found`,
		"NOT_FOUND",
		HttpStatusCodes.NOT_FOUND
	);
}

// Unauthorized response helper
export function unauthorized(
	c: Context,
	message: string = "Authentication required"
): Response {
	return error(c, message, "UNAUTHORIZED", HttpStatusCodes.UNAUTHORIZED);
}

// Forbidden response helper
export function forbidden(
	c: Context,
	message: string = "Access forbidden"
): Response {
	return error(c, message, "FORBIDDEN", HttpStatusCodes.FORBIDDEN);
}

// Conflict response helper
export function conflict(
	c: Context,
	message: string,
	details?: Record<string, unknown>
): Response {
	return error(c, message, "CONFLICT", HttpStatusCodes.CONFLICT, details);
}

// Internal server error response helper
export function internalError(
	c: Context,
	message: string = "Internal server error"
): Response {
	return error(
		c,
		message,
		"INTERNAL_ERROR",
		HttpStatusCodes.INTERNAL_SERVER_ERROR
	);
}
