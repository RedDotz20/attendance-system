import { Hono } from "hono";
import {
	registerRfidCard,
	markAttendance,
	checkRfidCard,
	getAllRfidCards,
	getAttendanceHistory,
} from "../controller/rfid.controller.js";
import {
	apiKeyAuthFlexible,
	apiKeyAuth,
} from "../../../shared/middleware/api-key.middleware.js";

export const rfid = new Hono();

// RFID Card Registration - Used by ESP32 in register mode
// Uses flexible API key auth (header or query param) for hardware compatibility
rfid.post("/register", apiKeyAuthFlexible, registerRfidCard);

// Mark Attendance - Used by ESP32 in attendance mode
// Uses flexible API key auth (header or query param) for hardware compatibility
rfid.post("/attendance", apiKeyAuthFlexible, markAttendance);

// Check if card is registered - Used by ESP32 to validate cards
// Uses flexible API key auth (header or query param) for hardware compatibility
rfid.get("/check/:uid", apiKeyAuthFlexible, checkRfidCard);

// Admin endpoints for web dashboard - require API key in header
rfid.get("/cards", apiKeyAuth, getAllRfidCards);
rfid.get("/attendance", apiKeyAuth, getAttendanceHistory);
