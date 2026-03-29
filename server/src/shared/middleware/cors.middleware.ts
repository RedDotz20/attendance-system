import { cors } from "hono/cors";
import { env } from "@/shared/config/env.js";

const allowedOrigins = [
	env["FRONTEND_ORIGIN"] || "http://localhost:3001",
	"http://localhost",
	"http://localhost:80",
	"http://127.0.0.1",
	"http://127.0.0.1:80",
];
const isProd = env["NODE_ENV"] === "production";

export const corsMiddleware = cors({
	origin: (requestOrigin) => {
		if (!requestOrigin) return ""; // deny if no Origin header

		// Allow if in allowedOrigins
		if (allowedOrigins.includes(requestOrigin)) return requestOrigin;

		// Allow localhost and 192.168.x.x in dev
		if (
			!isProd &&
			(requestOrigin.startsWith("http://localhost") ||
				requestOrigin.startsWith("http://127.0.0.1") ||
				requestOrigin.match(/^http:\/\/192\.168\.\d+\.\d+/))
		) {
			return requestOrigin;
		}

		// Deny if it doesn't match
		return "";
	},
	credentials: true,
	allowHeaders: [
		"Content-Type",
		"Authorization",
		"Cookie",
		"x-api-key",
		"X-API-Key",
	],
	allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});
