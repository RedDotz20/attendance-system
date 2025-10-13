/**
 * Main application setup with strict typing and enhanced error handling
 */

import { Hono } from "hono";
import type { Context } from "hono";
import { csrf } from "hono/csrf";
import { secureHeaders } from "hono/secure-headers";
import { logger } from "hono/logger";

// Route imports
import { healthCheckController } from "./shared/controller/health.controller.js";
import { corsMiddleware } from "./shared/middleware/cors.middleware.js";
import { auth } from "./modules/auth/routes/auth.routes.js";
import { rfid } from "./modules/rfid/routes/rfid.routes.js";
import { fingerprint } from "./modules/fingerprint/routes/fingerprint.routes.js";

// Configuration and utilities
import { connectDB } from "./shared/config/database.js";
import { mqttService } from "./shared/services/mqtt.service.js";
import { upstashRateLimit } from "@/shared/middleware/rateLimiter.middleware.js";
import {
	sessionAuth,
	requireRole,
} from "./shared/middleware/auth.middleware.js";
import { apiKeyAuth } from "./shared/middleware/api-key.middleware.js";
import { createErrorHandler } from "./shared/utils/error-handler.js";
import { success } from "./shared/utils/response.js";
import { UserRoles } from "./modules/users/types/user.type.js";
import type { HonoVariables } from "@/shared/types/variables.js";
import { logger as CustomLog } from "./shared/utils/logger.js";

// Create Hono app with strict typing
const app = new Hono<{ Variables: HonoVariables }>();

// Global middleware
app.use("*", corsMiddleware);
app.use(secureHeaders());
// app.use(csrf()); // Enable when needed
app.use(logger());

// Connect to database
await connectDB();

// Initialize MQTT service
try {
	await mqttService.connect();
	CustomLog.info("MQTT service connected successfully");

	// Register event handlers for real-time processing
	mqttService.onAttendanceEvent((event) => {
		CustomLog.info(
			`Real-time attendance event received from device ${event.device_id} for fingerprint ${event.fingerprint_id}`
		);
		// Here you can add additional real-time processing logic
		// such as pushing to connected WebSocket clients, updating dashboards, etc.
	});

	mqttService.onDeviceStatus((status) => {
		CustomLog.info(`Device ${status.device_id} status: ${status.status}`);
		// Handle device status updates
	});
} catch (error) {
	CustomLog.error("Failed to initialize MQTT service");
}

// Rate limiting (enable when needed)
// app.use("/api/*", upstashRateLimit);

// Routes
app.route("/auth", auth);
app.route("/rfid", rfid);
app.route("/fingerprint", fingerprint);

// Protected routes
app.get("/health", healthCheckController);

// Admin endpoint - requires both API key and admin session
app.get(
	"/admin",
	apiKeyAuth,
	sessionAuth,
	requireRole(UserRoles.ADMIN, false),
	(c: Context) => {
		const user = c.get("user");
		return success(
			c,
			{
				message: `Hello ${user.name}`,
				role: user.role,
				email: user.email,
				id: user.id,
			},
			"Admin access granted"
		);
	}
);

// Dashboard endpoint - requires both API key and user session (admin or user)
app.get(
	"/dashboard",
	apiKeyAuth,
	sessionAuth,
	requireRole(UserRoles.USER, true),
	(c: Context) => {
		const user = c.get("user");
		return success(
			c,
			{
				message: `Welcome ${user.name}`,
				role: user.role,
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.role,
				},
			},
			"Dashboard access granted"
		);
	}
);

// Global error handler
app.onError(createErrorHandler());

// 404 handler
app.notFound((c: Context) => {
	CustomLog.warn({ url: c.req.url, method: c.req.method }, "Route not found");
	return c.json(
		{
			success: false,
			message: "Route not found",
			error: {
				code: "NOT_FOUND",
				message: `Cannot ${c.req.method} ${c.req.url}`,
			},
			timestamp: new Date().toISOString(),
		},
		404
	);
});

export default app;
