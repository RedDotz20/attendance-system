import { AxiosError, type AxiosResponse } from "axios";
import apiFP from "@/lib/axios-fingerprint";
import type { ApiResponse, ApiErrorResponse } from "@/types/api";
import { isSuccessResponse } from "@/types/api";

/**
 * API client specifically for fingerprint/device control endpoints that require API key
 * This is separate from the main ApiClient which is used for auth endpoints
 */
export class ApiFingerprintClient {
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
	 * Extracts data from API response
	 */
	private static extractResponseData<T>(
		response: AxiosResponse<ApiResponse<T> | T>
	): T {
		const data = response.data;

		// Check if it's the API response format
		if (typeof data === "object" && data !== null && "success" in data) {
			const apiResponse = data as ApiResponse<T>;

			if (isSuccessResponse(apiResponse)) {
				return apiResponse.data;
			} else {
				const errorMsg = apiResponse.error?.message || "Unknown error";
				throw new Error(errorMsg);
			}
		}

		// Return raw data if not in API response format
		return data as T;
	}

	/**
	 * Perform a GET request
	 */
	static async get<T>(url: string): Promise<T> {
		try {
			const response = await apiFP.get<ApiResponse<T> | T>(url);
			return this.extractResponseData<T>(response);
		} catch (error) {
			this.handleError(error);
		}
	}

	/**
	 * Perform a POST request
	 */
	static async post<T, D = any>(url: string, data?: D): Promise<T> {
		try {
			const response = await apiFP.post<ApiResponse<T> | T>(url, data);
			return this.extractResponseData<T>(response);
		} catch (error) {
			this.handleError(error);
		}
	}

	/**
	 * Perform a PUT request
	 */
	static async put<T, D = any>(url: string, data?: D): Promise<T> {
		try {
			const response = await apiFP.put<ApiResponse<T> | T>(url, data);
			return this.extractResponseData<T>(response);
		} catch (error) {
			this.handleError(error);
		}
	}

	/**
	 * Perform a PATCH request
	 */
	static async patch<T, D = any>(url: string, data?: D): Promise<T> {
		try {
			const response = await apiFP.patch<ApiResponse<T> | T>(url, data);
			return this.extractResponseData<T>(response);
		} catch (error) {
			this.handleError(error);
		}
	}

	/**
	 * Perform a DELETE request
	 */
	static async delete<T>(url: string): Promise<T> {
		try {
			const response = await apiFP.delete<ApiResponse<T> | T>(url);
			return this.extractResponseData<T>(response);
		} catch (error) {
			this.handleError(error);
		}
	}
}
