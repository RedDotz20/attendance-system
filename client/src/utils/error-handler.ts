/**
 * Enhanced error class with additional context
 */
export class AppError extends Error {
	public readonly statusCode: number | undefined;
	public readonly originalError: Error | undefined;
	public readonly timestamp: string;

	constructor(message: string, statusCode?: number, originalError?: Error) {
		super(message);
		this.name = "AppError";
		this.statusCode = statusCode;
		this.originalError = originalError;
		this.timestamp = new Date().toISOString();

		// Maintains proper stack trace for where our error was thrown (only available on V8)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, AppError);
		}
	}

	/**
	 * Create an AppError from an unknown error
	 */
	static fromUnknown(
		error: unknown,
		defaultMessage = "An unexpected error occurred"
	): AppError {
		if (error instanceof AppError) {
			return error;
		}

		if (error instanceof Error) {
			return new AppError(error.message, undefined, error);
		}

		if (typeof error === "string") {
			return new AppError(error);
		}

		return new AppError(defaultMessage);
	}

	/**
	 * Check if error is a network error
	 */
	isNetworkError(): boolean {
		return (
			this.message.toLowerCase().includes("network") ||
			this.statusCode === undefined
		);
	}

	/**
	 * Check if error is an authentication error
	 */
	isAuthError(): boolean {
		return this.statusCode === 401 || this.statusCode === 403;
	}

	/**
	 * Check if error is a validation error
	 */
	isValidationError(): boolean {
		return this.statusCode === 400 || this.statusCode === 422;
	}

	/**
	 * Get user-friendly error message
	 */
	getUserMessage(): string {
		if (this.isNetworkError()) {
			return "Connection error. Please check your internet connection.";
		}

		if (this.isAuthError()) {
			return "Authentication required. Please log in again.";
		}

		if (this.isValidationError()) {
			return this.message || "Please check your input and try again.";
		}

		return this.message || "Something went wrong. Please try again.";
	}
}

/**
 * Error handling utilities
 */
export class ErrorHandler {
	/**
	 * Handle and log errors consistently
	 */
	static handle(error: unknown, context?: string): AppError {
		const appError = AppError.fromUnknown(error);

		// Log error with context
		console.error(`[${context || "Error"}]:`, {
			message: appError.message,
			statusCode: appError.statusCode,
			timestamp: appError.timestamp,
			originalError: appError.originalError,
		});

		return appError;
	}

	/**
	 * Handle async errors safely
	 */
	static async handleAsync<T>(
		asyncFn: () => Promise<T>,
		context?: string
	): Promise<[T | null, AppError | null]> {
		try {
			const result = await asyncFn();
			return [result, null];
		} catch (error) {
			const appError = this.handle(error, context);
			return [null, appError];
		}
	}
}
