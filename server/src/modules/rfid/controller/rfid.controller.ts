import type { Context } from "hono";
import { RfidCard } from "../models/rfid.model.js";
import { Attendance } from "../models/attendance.model.js";
import {
	rfidRegistrationSchema,
	attendanceSchema,
	uidParamSchema,
} from "../validators/rfid.validator.js";
import { logger } from "@/shared/utils/logger.js";

export const registerRfidCard = async (c: Context) => {
	try {
		const body = await c.req.json();
		const validatedData = rfidRegistrationSchema.parse(body);

		// Check if card is already registered
		const existingCard = await RfidCard.findOne({ uid: validatedData.uid });
		if (existingCard) {
			return c.json(
				{
					success: false,
					message: "RFID card is already registered",
					data: {
						uid: existingCard.uid,
						name: existingCard.name,
						department: existingCard.department,
					},
				},
				409
			);
		}

		// Create new RFID card registration
		const newCard = new RfidCard(validatedData);
		await newCard.save();

		logger.info(
			{
				action: "RFID_REGISTRATION",
				uid: validatedData.uid,
				name: validatedData.name,
				department: validatedData.department,
			},
			"New RFID card registered"
		);

		return c.json(
			{
				success: true,
				message: "RFID card registered successfully",
				data: {
					uid: newCard.uid,
					name: newCard.name,
					department: newCard.department,
					isActive: newCard.isActive,
					createdAt: newCard.createdAt,
				},
			},
			201
		);
	} catch (error: any) {
		logger.error({ error: error.message }, "Error registering RFID card");

		if (error.name === "ZodError") {
			return c.json(
				{
					success: false,
					message: "Validation failed",
					errors: error.errors,
				},
				400
			);
		}

		if (error.code === 11000) {
			return c.json(
				{
					success: false,
					message: "RFID card is already registered",
				},
				409
			);
		}

		return c.json(
			{
				success: false,
				message: "Internal server error",
			},
			500
		);
	}
};

export const markAttendance = async (c: Context) => {
	try {
		const body = await c.req.json();
		const validatedData = attendanceSchema.parse(body);

		// Check if card is registered
		const card = await RfidCard.findOne({
			uid: validatedData.uid,
			isActive: true,
		});

		if (!card) {
			return c.json(
				{
					success: false,
					message: "RFID card not found or inactive",
				},
				404
			);
		}

		// Create attendance record
		const attendanceRecord = new Attendance({
			uid: card.uid,
			name: card.name,
			department: card.department,
		});

		await attendanceRecord.save();

		logger.info(
			{
				action: "ATTENDANCE_MARKED",
				uid: card.uid,
				name: card.name,
				department: card.department,
			},
			"Attendance marked"
		);

		return c.json(
			{
				success: true,
				message: "Attendance marked successfully",
				data: {
					uid: attendanceRecord.uid,
					name: attendanceRecord.name,
					department: attendanceRecord.department,
					timestamp: attendanceRecord.timestamp,
				},
			},
			201
		);
	} catch (error: any) {
		logger.error({ error: error.message }, "Error marking attendance");

		if (error.name === "ZodError") {
			return c.json(
				{
					success: false,
					message: "Validation failed",
					errors: error.errors,
				},
				400
			);
		}

		return c.json(
			{
				success: false,
				message: "Internal server error",
			},
			500
		);
	}
};

export const checkRfidCard = async (c: Context) => {
	try {
		const { uid } = c.req.param();
		const validatedParam = uidParamSchema.parse({ uid });

		const card = await RfidCard.findOne({
			uid: validatedParam.uid,
			isActive: true,
		});

		if (!card) {
			return c.json(
				{
					success: false,
					message: "RFID card not found",
					registered: false,
				},
				404
			);
		}

		return c.json(
			{
				success: true,
				message: "RFID card found",
				registered: true,
				data: {
					uid: card.uid,
					name: card.name,
					department: card.department,
					isActive: card.isActive,
					createdAt: card.createdAt,
				},
			},
			200
		);
	} catch (error: any) {
		logger.error(
			{ error: error.message, uid: c.req.param("uid") },
			"Error checking RFID card"
		);

		if (error.name === "ZodError") {
			return c.json(
				{
					success: false,
					message: "Invalid UID format",
					registered: false,
					errors: error.errors,
				},
				400
			);
		}

		return c.json(
			{
				success: false,
				message: "Internal server error",
				registered: false,
			},
			500
		);
	}
};

export const getAllRfidCards = async (c: Context) => {
	try {
		const page = parseInt(c.req.query("page") || "1");
		const limit = parseInt(c.req.query("limit") || "10");
		const department = c.req.query("department");
		const search = c.req.query("search");

		const filter: any = { isActive: true };

		if (department) {
			filter.department = new RegExp(department, "i");
		}

		if (search) {
			filter.$or = [
				{ name: new RegExp(search, "i") },
				{ uid: new RegExp(search, "i") },
			];
		}

		const skip = (page - 1) * limit;

		const [cards, total] = await Promise.all([
			RfidCard.find(filter)
				.select("-__v")
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit),
			RfidCard.countDocuments(filter),
		]);

		return c.json(
			{
				success: true,
				message: "RFID cards retrieved successfully",
				data: {
					cards,
					pagination: {
						page,
						limit,
						total,
						pages: Math.ceil(total / limit),
					},
				},
			},
			200
		);
	} catch (error: any) {
		logger.error({ error: error.message }, "Error getting RFID cards");

		return c.json(
			{
				success: false,
				message: "Internal server error",
			},
			500
		);
	}
};

export const getAttendanceHistory = async (c: Context) => {
	try {
		const page = parseInt(c.req.query("page") || "1");
		const limit = parseInt(c.req.query("limit") || "10");
		const department = c.req.query("department");
		const uid = c.req.query("uid");
		const startDate = c.req.query("startDate");
		const endDate = c.req.query("endDate");

		const filter: any = {};

		if (department) {
			filter.department = new RegExp(department, "i");
		}

		if (uid) {
			filter.uid = uid.toUpperCase();
		}

		if (startDate || endDate) {
			filter.timestamp = {};
			if (startDate) {
				filter.timestamp.$gte = new Date(startDate);
			}
			if (endDate) {
				filter.timestamp.$lte = new Date(endDate);
			}
		}

		const skip = (page - 1) * limit;

		const [attendance, total] = await Promise.all([
			Attendance.find(filter)
				.select("-__v")
				.sort({ timestamp: -1 })
				.skip(skip)
				.limit(limit),
			Attendance.countDocuments(filter),
		]);

		return c.json(
			{
				success: true,
				message: "Attendance history retrieved successfully",
				data: {
					attendance,
					pagination: {
						page,
						limit,
						total,
						pages: Math.ceil(total / limit),
					},
				},
			},
			200
		);
	} catch (error: any) {
		logger.error({ error: error.message }, "Error getting attendance history");

		return c.json(
			{
				success: false,
				message: "Internal server error",
			},
			500
		);
	}
};
