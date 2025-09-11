/**
 * Validation middleware for request validation with strict typing
 */

import type { Context, Next, MiddlewareHandler } from "hono";
import type { ZodSchema, ZodError, ZodIssue } from "zod";
import { validationError } from "@/shared/utils/response.js";
import { logger } from "@/shared/utils/logger.js";

export interface ValidationTarget {
	body?: ZodSchema;
	params?: ZodSchema;
	query?: ZodSchema;
	headers?: ZodSchema;
}

/**
 * Validation middleware factory
 * @param schemas - Object containing validation schemas for different parts of the request
 */
export function validate(schemas: ValidationTarget): MiddlewareHandler {
	return async (c: Context, next: Next): Promise<Response | void> => {
		try {
			const errors: Array<{ field: string; message: string; code: string }> =
				[];

			// Validate request body
			if (schemas.body) {
				try {
					const body = await c.req.json();
					const result = schemas.body.safeParse(body);
					if (!result.success) {
						result.error.issues.forEach((err: ZodIssue) => {
							errors.push({
								field: `body.${err.path.join(".")}`,
								message: err.message,
								code: err.code,
							});
						});
					} else {
						c.set("validatedBody", result.data);
					}
				} catch (error) {
					errors.push({
						field: "body",
						message: "Invalid JSON format",
						code: "invalid_json",
					});
				}
			}

			// Validate URL parameters
			if (schemas.params) {
				const params = c.req.param();
				const result = schemas.params.safeParse(params);
				if (!result.success) {
					result.error.issues.forEach((err: ZodIssue) => {
						errors.push({
							field: `params.${err.path.join(".")}`,
							message: err.message,
							code: err.code,
						});
					});
				} else {
					c.set("validatedParams", result.data);
				}
			}

			// Validate query parameters
			if (schemas.query) {
				const queries = c.req.queries();
				const query: Record<string, string | string[]> = {};

				// Convert query parameters to a proper object
				for (const [key, values] of Object.entries(queries)) {
					if (values && values.length > 0) {
						query[key] = values.length === 1 ? values[0]! : values;
					}
				}

				const result = schemas.query.safeParse(query);
				if (!result.success) {
					result.error.issues.forEach((err: ZodIssue) => {
						errors.push({
							field: `query.${err.path.join(".")}`,
							message: err.message,
							code: err.code,
						});
					});
				} else {
					c.set("validatedQuery", result.data);
				}
			}

			// Validate headers
			if (schemas.headers) {
				const rawHeaders = c.req.header();
				const headers: Record<string, string> = {};

				// Convert headers to proper object
				for (const [key, value] of Object.entries(rawHeaders)) {
					headers[key] = value;
				}

				const result = schemas.headers.safeParse(headers);
				if (!result.success) {
					result.error.issues.forEach((err: ZodIssue) => {
						errors.push({
							field: `headers.${err.path.join(".")}`,
							message: err.message,
							code: err.code,
						});
					});
				} else {
					c.set("validatedHeaders", result.data);
				}
			}

			if (errors.length > 0) {
				logger.warn(
					{
						errors,
						url: c.req.url,
						method: c.req.method,
					},
					"Request validation failed"
				);

				return validationError(c, errors, "Request validation failed");
			}

			await next();
		} catch (error) {
			logger.error({ error }, "Validation middleware error");
			return validationError(c, [
				{
					field: "validation",
					message: "Validation processing failed",
					code: "validation_error",
				},
			]);
		}
	};
}

/**
 * Body validation middleware
 */
export function validateBody(schema: ZodSchema): MiddlewareHandler {
	return validate({ body: schema });
}

/**
 * Params validation middleware
 */
export function validateParams(schema: ZodSchema): MiddlewareHandler {
	return validate({ params: schema });
}

/**
 * Query validation middleware
 */
export function validateQuery(schema: ZodSchema): MiddlewareHandler {
	return validate({ query: schema });
}

/**
 * Headers validation middleware
 */
export function validateHeaders(schema: ZodSchema): MiddlewareHandler {
	return validate({ headers: schema });
}

/**
 * Helper to get validated data from context
 */
export function getValidatedData<T>(
	c: Context,
	target: keyof ValidationTarget
): T {
	switch (target) {
		case "body":
			return c.get("validatedBody") as T;
		case "params":
			return c.get("validatedParams") as T;
		case "query":
			return c.get("validatedQuery") as T;
		case "headers":
			return c.get("validatedHeaders") as T;
		default:
			throw new Error(`Invalid validation target: ${target}`);
	}
}
