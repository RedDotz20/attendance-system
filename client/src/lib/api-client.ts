import { AxiosError, type AxiosResponse } from "axios";
import api from "@/lib/axios";
import type { ApiResponse, ApiErrorResponse } from "@/types/api";
import { isSuccessResponse } from "@/types/api";

/**
 * Enhanced API client utility class with standardized error handling
 * Updated to work with the new server response structure
 */
export class ApiClient {
	/**
	 * Handles API errors and extracts meaningful error messages
	 */
	private static handleError(error: unknown): never {
		if (error instanceof AxiosError) {
			const errorResponse = error.response?.data as
				| ApiErrorResponse
				| undefined;

			if (errorResponse && !errorResponse.success) {
				// Handle validation errors
				if (errorResponse.errors && errorResponse.errors.length > 0) {
					const validationMessages = errorResponse.errors
						.map((err) => `${err.field}: ${err.message}`)
						.join(", ");

					const apiError = new Error(
						`Validation failed: ${validationMessages}`
					);
					(apiError as any).statusCode = error.response?.status;
					(apiError as any).code = errorResponse.error.code;
					(apiError as any).validationErrors = errorResponse.errors;
					(apiError as any).originalError = error;
					throw apiError;
				}

				// Handle general API errors
				const message =
					errorResponse.error?.message ||
					errorResponse.message ||
					"An error occurred";
				const apiError = new Error(message);
				(apiError as any).statusCode = error.response?.status;
				(apiError as any).code = errorResponse.error?.code;
				(apiError as any).originalError = error;
				throw apiError;
			}

			// Fallback for non-API errors
			const message = error.message || "An unexpected error occurred";
			const apiError = new Error(message);
			(apiError as any).statusCode = error.response?.status;
			(apiError as any).originalError = error;
			throw apiError;
		}

		if (error instanceof Error) {
			throw error;
		}

		throw new Error("An unexpected error occurred");
	}

	/**
	 * Extracts data from API response, handling both old and new response formats
	 */
	private static extractResponseData<T>(
		response: AxiosResponse<ApiResponse<T> | T>
	): T {
		const data = response.data;

		// Check if it's the new API response format
		if (typeof data === "object" && data !== null && "success" in data) {
			const apiResponse = data as ApiResponse<T>;

			if (isSuccessResponse(apiResponse)) {
				return apiResponse.data;
			} else {
				// This is an error response that somehow got through
				const errorMsg = apiResponse.error?.message || "Unknown error";
				const error = new Error(errorMsg);
				(error as any).code = apiResponse.error?.code;
				throw error;
			}
		}

		// Fallback for old format or direct data responses
		return data as T;
	}

	/**
	 * Makes a GET request with standardized error handling
	 */
	static async get<T>(url: string): Promise<T> {
		try {
			const response: AxiosResponse<ApiResponse<T> | T> = await api.get(url);
			return this.extractResponseData<T>(response);
		} catch (error) {
			this.handleError(error);
		}
	}

	/**
	 * Makes a POST request with standardized error handling
	 */
	static async post<T, D = unknown>(url: string, data?: D): Promise<T> {
		try {
			const response: AxiosResponse<ApiResponse<T> | T> = await api.post(
				url,
				data
			);
			return this.extractResponseData<T>(response);
		} catch (error) {
			this.handleError(error);
		}
	}

	/**
	 * Makes a PUT request with standardized error handling
	 */
	static async put<T, D = unknown>(url: string, data?: D): Promise<T> {
		try {
			const response: AxiosResponse<ApiResponse<T> | T> = await api.put(
				url,
				data
			);
			return this.extractResponseData<T>(response);
		} catch (error) {
			this.handleError(error);
		}
	}

	/**
	 * Makes a PATCH request with standardized error handling
	 */
	static async patch<T, D = unknown>(url: string, data?: D): Promise<T> {
		try {
			const response: AxiosResponse<ApiResponse<T> | T> = await api.patch(
				url,
				data
			);
			return this.extractResponseData<T>(response);
		} catch (error) {
			this.handleError(error);
		}
	}

	/**
	 * Makes a DELETE request with standardized error handling
	 */
	static async delete<T>(url: string): Promise<T> {
		try {
			const response: AxiosResponse<ApiResponse<T> | T> = await api.delete(url);
			return this.extractResponseData<T>(response);
		} catch (error) {
			this.handleError(error);
		}
	}
}
