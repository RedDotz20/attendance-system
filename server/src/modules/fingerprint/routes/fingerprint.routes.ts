import { Hono } from "hono";
import {
	registerFingerprint,
	markFingerprintAttendance,
	checkFingerprint,
	getAllFingerprints,
	getFingerprintAttendanceHistory,
} from "../controller/fingerprint.controller.js";
import {
	apiKeyAuthFlexible,
	apiKeyAuth,
} from "../../../shared/middleware/api-key.middleware.js";

export const fingerprint = new Hono();

// Fingerprint Registration - Used by ESP32 in register mode
// Uses flexible API key auth (header or query param) for hardware compatibility
fingerprint.post("/register", apiKeyAuthFlexible, registerFingerprint);

// Mark Attendance - Used by ESP32 in attendance mode
// Uses flexible API key auth (header or query param) for hardware compatibility
fingerprint.post("/attendance", apiKeyAuthFlexible, markFingerprintAttendance);

// Check if fingerprint is registered - Used by ESP32 to validate fingerprints
// Uses flexible API key auth (header or query param) for hardware compatibility
fingerprint.get("/check/:fingerprintId", apiKeyAuthFlexible, checkFingerprint);

// Admin endpoints for web dashboard - require API key in header
fingerprint.get("/fingerprints", apiKeyAuth, getAllFingerprints);
fingerprint.get("/attendance", apiKeyAuth, getFingerprintAttendanceHistory);
