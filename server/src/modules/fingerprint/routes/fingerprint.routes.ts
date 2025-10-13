import { Hono } from "hono";
import {
	registerFingerprint,
	markFingerprintAttendance,
	checkFingerprintRegistration,
	getAllFingerprints,
	getFingerprintAttendance,
} from "../controller/fingerprint.controller.js";
import {
	apiKeyAuthFlexible,
	apiKeyAuth,
} from "../../../shared/middleware/api-key.middleware.js";
import { logger } from "@/shared/utils/logger.js";

export const fingerprint = new Hono();

// Add request logging middleware for all fingerprint routes
fingerprint.use("*", async (c, next) => {
	const method = c.req.method;
	const path = c.req.path;
	logger.info(`🔵 Fingerprint route hit: ${method} ${path}`);
	await next();
});

// Fingerprint Registration - Used by ESP32 in register mode
// Uses flexible API key auth (header or query param) for hardware compatibility
fingerprint.post("/register", apiKeyAuthFlexible, registerFingerprint);

// Mark Attendance - Used by ESP32 in attendance mode
// Uses flexible API key auth (header or query param) for hardware compatibility
fingerprint.post("/attendance", apiKeyAuthFlexible, markFingerprintAttendance);

// Check if fingerprint is registered - Used by ESP32 to validate fingerprints
// Uses flexible API key auth (header or query param) for hardware compatibility
fingerprint.get("/check/:id", apiKeyAuthFlexible, checkFingerprintRegistration);

// Admin endpoints for web dashboard - require API key in header
fingerprint.get("/fingerprints", apiKeyAuth, getAllFingerprints);
fingerprint.get("/attendance", apiKeyAuth, getFingerprintAttendance);
