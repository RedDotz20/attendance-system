import { cors } from "hono/cors";
import { env } from "@/shared/config/env.js";

const allowedOrigin = env.FRONTEND_ORIGIN || "http://localhost:3001";
const isProd = env.NODE_ENV === "production";

export const corsMiddleware = cors({
	origin: (requestOrigin) => {
		if (!requestOrigin) return ""; // deny if no Origin header

		// Match request origin with allowed origin explicitly
		if (requestOrigin === allowedOrigin) return requestOrigin;

		// Allow localhost in dev if needed
		if (!isProd && requestOrigin.startsWith("http://localhost")) {
			return requestOrigin;
		}

		// Deny if it doesn’t match
		return "";
	},
	credentials: true,
	allowHeaders: ["Content-Type", "Authorization", "Cookie"],
	allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});
