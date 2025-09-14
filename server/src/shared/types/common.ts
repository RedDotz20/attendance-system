/**
 * Common types and utilities for the application
 */

// Legacy API response structure (deprecated - use types from api.ts)
export interface ApiResponse<T> {
	success: boolean;
	message?: string;
	data?: T;
	errors?: { field: string; message: string }[];
}

// Database document base interface
export interface BaseDocument {
	readonly _id: string;
	readonly createdAt: Date;
	readonly updatedAt: Date;
}

// Utility type to make properties optional
export type Partial<T> = {
	[P in keyof T]?: T[P];
};

// Utility type to make properties required
export type Required<T> = {
	[P in keyof T]-?: T[P];
};

// Utility type for omitting properties
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

// Environment types
export type Environment = "development" | "production" | "test";

// HTTP status codes
export const HttpStatusCodes = {
	OK: 200,
	CREATED: 201,
	NO_CONTENT: 204,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	CONFLICT: 409,
	INTERNAL_SERVER_ERROR: 500,
} as const;

export type HttpStatusCode =
	(typeof HttpStatusCodes)[keyof typeof HttpStatusCodes];

// Error codes for consistent error handling
export const ErrorCodes = {
	VALIDATION_ERROR: "VALIDATION_ERROR",
	UNAUTHORIZED: "UNAUTHORIZED",
	FORBIDDEN: "FORBIDDEN",
	NOT_FOUND: "NOT_FOUND",
	CONFLICT: "CONFLICT",
	INTERNAL_ERROR: "INTERNAL_ERROR",
	DATABASE_ERROR: "DATABASE_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// Generic result type for operations that can fail
export type Result<T, E = Error> =
	| { success: true; data: T }
	| { success: false; error: E };

// Type guard for checking if result is successful
export function isSuccess<T, E>(
	result: Result<T, E>
): result is { success: true; data: T } {
	return result.success === true;
}

// Type guard for checking if result is an error
export function isError<T, E>(
	result: Result<T, E>
): result is { success: false; error: E } {
	return result.success === false;
}
