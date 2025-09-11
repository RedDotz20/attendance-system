/**
 * Shared API types that match the server's API response structure
 * These types should be kept in sync with the server's API types
 */

// Base API response structure (matches server)
export interface BaseApiResponse {
	success: boolean;
	message?: string;
	timestamp: string;
}

// Success response with data (matches server)
export interface ApiSuccessResponse<T = unknown> extends BaseApiResponse {
	success: true;
	data: T;
}

// Error response structure (matches server)
export interface ApiErrorResponse extends BaseApiResponse {
	success: false;
	error: {
		code: string;
		message: string;
		details?: Record<string, unknown>;
	};
	errors?: ValidationError[];
}

// Validation error structure (matches server)
export interface ValidationError {
	field: string;
	message: string;
	code: string;
}

// Union type for all API responses (matches server)
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// Pagination interface (matches server)
export interface PaginationParams {
	page: number;
	limit: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
	data: T[];
	pagination: {
		currentPage: number;
		totalPages: number;
		totalItems: number;
		itemsPerPage: number;
		hasNextPage: boolean;
		hasPrevPage: boolean;
	};
}

// Query parameters interface (matches server)
export interface BaseQueryParams {
	search?: string;
	filter?: Record<string, string | number | boolean>;
}

// HTTP status codes (matches server)
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

// Error codes (matches server)
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

// Generic result type for operations that can fail (matches server)
export type Result<T, E = Error> =
	| { success: true; data: T }
	| { success: false; error: E };

// Type guards for API responses
export function isSuccessResponse<T>(
	response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
	return response.success === true;
}

export function isErrorResponse<T>(
	response: ApiResponse<T>
): response is ApiErrorResponse {
	return response.success === false;
}

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
