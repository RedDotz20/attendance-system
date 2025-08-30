import { Hono } from "hono";
import {
	registerRfidCard,
	markAttendance,
	checkRfidCard,
	getAllRfidCards,
	getAttendanceHistory,
} from "../controller/rfid.controller.js";

export const rfid = new Hono();

// RFID Card Registration - Used by ESP32 in register mode
rfid.post("/register", registerRfidCard);

// Mark Attendance - Used by ESP32 in attendance mode
rfid.post("/attendance", markAttendance);

// Check if card is registered - Used by ESP32 to validate cards
rfid.get("/check/:uid", checkRfidCard);

// Admin endpoints for web dashboard
rfid.get("/cards", getAllRfidCards);
rfid.get("/attendance", getAttendanceHistory);
