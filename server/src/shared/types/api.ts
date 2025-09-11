/**
 * Comprehensive API response types with strict typing
 */

// Base API response structure
export interface BaseApiResponse {
	success: boolean;
	message?: string;
	timestamp: string;
}

// Success response with data
export interface ApiSuccessResponse<T = unknown> extends BaseApiResponse {
	success: true;
	data: T;
}

// Error response structure
export interface ApiErrorResponse extends BaseApiResponse {
	success: false;
	error: {
		code: string;
		message: string;
		details?: Record<string, unknown>;
	};
	errors?: ValidationError[];
}

// Validation error structure
export interface ValidationError {
	field: string;
	message: string;
	code: string;
}

// Union type for all API responses
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// Pagination interface
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

// Query parameters interface
export interface BaseQueryParams {
	search?: string;
	filter?: Record<string, string | number | boolean>;
}
