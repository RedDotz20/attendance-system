// src/shared/middleware/error-handler.ts
import type { Context } from "hono";
import type { ApiResponse } from "../types/common.js";
import { logger } from "@/shared/utils/logger.js";

export const errorHandler = async (err: Error, c: Context) => {
	logger.error(
		{
			err: err,
			path: c.req.path,
		},
		"Unhandled API Error"
	);

	// Default error message
	let message = "Internal Server Error";
	let statusCode = 500;
	let errors: { field: string; message: string }[] | undefined;

	// You can customize error handling based on error types
	if (err.message.includes("Not Found")) {
		// Example for specific errors
		message = err.message;
		statusCode = 404;
	} else if (err.message.startsWith("Validation Error")) {
		message = "Validation Failed";
		statusCode = 400;
		try {
			// Assuming a validation error might carry structured details
			const errorDetails = JSON.parse(
				err.message.replace("Validation Error: ", "")
			);
			if (Array.isArray(errorDetails)) {
				errors = errorDetails.map((e: any) => ({
					field: e.path ? e.path.join(".") : "unknown",
					message: e.message,
				}));
			}
		} catch (parseError) {
			logger.warn(
				{
					parseError: parseError,
				},
				"Could not parse validation error message"
			);
		}
	}

	const response: ApiResponse<null> = {
		success: false,
		message,
		errors,
	};

	return c.json(response, statusCode as any);
};
