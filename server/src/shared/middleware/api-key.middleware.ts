import type { MiddlewareHandler, Context, Next } from "hono";
import { env } from "@/shared/config/env.js";
import { logger } from "@/shared/utils/logger.js";

/**
 * Middleware to validate API secret key from request headers
 * Looks for the API key in the 'X-API-Key' header
 */
export const apiKeyAuth: MiddlewareHandler = async (c: Context, next: Next) => {
	const apiKey = c.req.header("X-API-Key");

	if (!apiKey) {
		logger.warn("API request attempted without API key");
		return c.json(
			{
				error: "API key required",
				message: "Please provide a valid API key in the X-API-Key header",
			},
			401
		);
	}

	if (apiKey !== env.API_SECRET_KEY) {
		logger.warn(
			{
				providedKey: apiKey?.substring(0, 8) + "...", // Log only first 8 chars for security
				ip: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
			},
			"API request attempted with invalid API key"
		);
		return c.json(
			{
				error: "Invalid API key",
				message: "The provided API key is not valid",
			},
			401
		);
	}

	logger.info(
		{
			path: c.req.path,
			method: c.req.method,
			ip: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
		},
		"Valid API key provided for request"
	);

	await next();
};

/**
 * Alternative middleware that checks for API key in query parameters
 * Use this for endpoints that might be called from hardware/IoT devices
 * that have difficulty setting custom headers
 */
export const apiKeyAuthQuery: MiddlewareHandler = async (
	c: Context,
	next: Next
) => {
	const apiKey = c.req.query("api_key");

	if (!apiKey) {
		logger.warn("API request attempted without API key (query param)");
		return c.json(
			{
				error: "API key required",
				message:
					"Please provide a valid API key in the 'api_key' query parameter",
			},
			401
		);
	}

	if (apiKey !== env.API_SECRET_KEY) {
		logger.warn(
			{
				providedKey: apiKey?.substring(0, 8) + "...", // Log only first 8 chars for security
				ip: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
			},
			"API request attempted with invalid API key (query param)"
		);
		return c.json(
			{
				error: "Invalid API key",
				message: "The provided API key is not valid",
			},
			401
		);
	}

	logger.info(
		{
			path: c.req.path,
			method: c.req.method,
			ip: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
		},
		"Valid API key provided for request (query param)"
	);

	await next();
};

/**
 * Flexible API key middleware that checks both header and query parameter
 * Uses header first, falls back to query parameter if header is not present
 */
export const apiKeyAuthFlexible: MiddlewareHandler = async (
	c: Context,
	next: Next
) => {
	const headerApiKey = c.req.header("X-API-Key");
	const queryApiKey = c.req.query("api_key");
	const apiKey = headerApiKey || queryApiKey;

	if (!apiKey) {
		logger.warn("API request attempted without API key (header or query)");
		return c.json(
			{
				error: "API key required",
				message:
					"Please provide a valid API key in the X-API-Key header or api_key query parameter",
			},
			401
		);
	}

	if (apiKey !== env.API_SECRET_KEY) {
		logger.warn(
			{
				providedKey: apiKey?.substring(0, 8) + "...", // Log only first 8 chars for security
				source: headerApiKey ? "header" : "query",
				ip: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
			},
			"API request attempted with invalid API key (flexible)"
		);
		return c.json(
			{
				error: "Invalid API key",
				message: "The provided API key is not valid",
			},
			401
		);
	}

	logger.info(
		{
			path: c.req.path,
			method: c.req.method,
			source: headerApiKey ? "header" : "query",
			ip: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
		},
		"Valid API key provided for request (flexible)"
	);

	await next();
};
