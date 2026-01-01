import { Hono } from "hono";
import {
	registerFingerprint,
	markFingerprintAttendance,
	checkFingerprintRegistration,
	getAllFingerprints,
	getFingerprintAttendance,
	getAttendanceStats,
	getUserAttendanceReport,
	getAttendanceLogs,
} from "../controller/fingerprint.controller.js";
import {
	setDeviceMode,
	getDeviceStatus,
	sendRegistrationData,
	broadcastToAllDevices,
} from "../controller/device.controller.js";
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

// Attendance management endpoints
fingerprint.get("/attendance", apiKeyAuth, getFingerprintAttendance); // With filters & pagination
fingerprint.get("/attendance/stats", apiKeyAuth, getAttendanceStats); // Statistics & analytics
fingerprint.get("/logs", apiKeyAuth, getAttendanceLogs); // Real-time event logs
fingerprint.get("/attendance/user/:id", apiKeyAuth, getUserAttendanceReport); // User-specific report

// Device control endpoints - require API key in header
fingerprint.post("/device/mode", apiKeyAuth, setDeviceMode); // Set device mode (register/attendance)
fingerprint.get("/device/status/:deviceId", apiKeyAuth, getDeviceStatus); // Request device status
fingerprint.post("/device/registration-data", apiKeyAuth, sendRegistrationData); // Send registration data to device
fingerprint.post("/device/broadcast", apiKeyAuth, broadcastToAllDevices); // Broadcast command to all devices
