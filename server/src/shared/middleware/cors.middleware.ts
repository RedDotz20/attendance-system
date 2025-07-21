import { cors } from "hono/cors";

const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3001";

export const corsMiddleware = cors({
	origin: frontendOrigin,
	credentials: true,
	allowHeaders: ["Content-Type", "Authorization"],
	allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});
