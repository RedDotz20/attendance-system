import { cors } from "hono/cors";
import { env } from "@/shared/config/env.js";

const frontendOrigin = env.FRONTEND_ORIGIN || "http://localhost:3001";

export const corsMiddleware = cors({
	origin: frontendOrigin,
	credentials: true,
	allowHeaders: ["Content-Type", "Authorization"],
	allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});
