import { AxiosError, type AxiosResponse } from "axios";
import api from "@/lib/axios";

/**
 * Standard API error response format
 */
export interface ApiErrorResponse {
	message: string;
	statusCode?: number;
	error?: string;
	details?: unknown;
}

/**
 * Standard API success response format
 */
export interface ApiSuccessResponse<T = unknown> {
	data: T;
	message?: string;
	success: boolean;
}

/**
 * API client utility class with standardized error handling
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

			// Extract error message from various possible locations
			const message =
				errorResponse?.message ||
				errorResponse?.error ||
				error.message ||
				"An unexpected error occurred";

			// Create a new error with the extracted message and include status info
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
	 * Makes a GET request with standardized error handling
	 */
	static async get<T>(url: string): Promise<T> {
		try {
			const response: AxiosResponse<T> = await api.get(url);
			return response.data;
		} catch (error) {
			this.handleError(error);
		}
	}

	/**
	 * Makes a POST request with standardized error handling
	 */
	static async post<T, D = unknown>(url: string, data?: D): Promise<T> {
		try {
			const response: AxiosResponse<T> = await api.post(url, data);
			return response.data;
		} catch (error) {
			this.handleError(error);
		}
	}

	/**
	 * Makes a PUT request with standardized error handling
	 */
	static async put<T, D = unknown>(url: string, data?: D): Promise<T> {
		try {
			const response: AxiosResponse<T> = await api.put(url, data);
			return response.data;
		} catch (error) {
			this.handleError(error);
		}
	}

	/**
	 * Makes a PATCH request with standardized error handling
	 */
	static async patch<T, D = unknown>(url: string, data?: D): Promise<T> {
		try {
			const response: AxiosResponse<T> = await api.patch(url, data);
			return response.data;
		} catch (error) {
			this.handleError(error);
		}
	}

	/**
	 * Makes a DELETE request with standardized error handling
	 */
	static async delete<T>(url: string): Promise<T> {
		try {
			const response: AxiosResponse<T> = await api.delete(url);
			return response.data;
		} catch (error) {
			this.handleError(error);
		}
	}
}
