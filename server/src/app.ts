import { Hono } from "hono";
import type { Context } from "hono";
import { csrf } from "hono/csrf";
import { secureHeaders } from "hono/secure-headers";
import { logger } from "hono/logger";
import { HTTPException } from "hono/http-exception";
import { healthCheckController } from "./shared/controller/health.controller.js";
import { corsMiddleware } from "./shared/middleware/cors.middleware.js";
import { auth } from "./modules/auth/routes/auth.routes.js";
import { rfid } from "./modules/rfid/routes/rfid.routes.js";
import { connectDB } from "./shared/config/database.js";
import { upstashRateLimit } from "@/shared/middleware/rateLimiter.middleware.js";
import type { HonoVariables } from "@/shared/types/variables.js";
import { logger as CustomLog } from "./shared/utils/logger.js";
import {
	sessionAuth,
	requireRole,
} from "./shared/middleware/auth.middleware.js";
import { apiKeyAuth } from "./shared/middleware/api-key.middleware.js";

const app = new Hono<{ Variables: HonoVariables }>();

app.use("*", corsMiddleware);

app.use(secureHeaders());
// app.use(csrf());
app.use(logger());

// connect mongodb database
await connectDB();

// use Rate Limit
// app.use("/health/*", upstashRateLimit);

app.route("/auth", auth);
app.route("/rfid", rfid);

// Admin endpoint - requires both API key and admin session
app.get(
	"/admin",
	apiKeyAuth,
	sessionAuth,
	requireRole("admin"),
	(c: Context) => {
		const user = c.get("user");
		return c.json(
			{
				message: `Hello ${user.name}`,
				role: user.role,
				email: user.email,
				id: user.id,
			},
			200
		);
	}
);

// Dashboard endpoint - requires both API key and user session
app.get(
	"/dashboard",
	apiKeyAuth,
	sessionAuth,
	requireRole("user"),
	(c: Context) => {
		const user = c.get("user");
		return c.json({ message: `Hello ${user.name}`, role: user.role }, 200);
	}
);

app.get("/health", healthCheckController);

app.onError((err: Error, c: Context) => {
	if (err instanceof HTTPException) {
		return err.getResponse();
	}

	CustomLog.error({ err: err }, "Unhandled Error:");
	return c.json({ error: "Internal Server Error" }, 500);
});

export default app;
