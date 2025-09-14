import type { Context } from "hono";
import { Fingerprint } from "../models/fingerprint.model.js";
import { FingerprintAttendance } from "../models/attendance.model.js";
import {
	fingerprintRegistrationSchema,
	fingerprintAttendanceSchema,
	fingerprintIdParamSchema,
} from "../validators/fingerprint.validator.js";
import { logger } from "@/shared/utils/logger.js";

export const registerFingerprint = async (c: Context) => {
	try {
		const body = await c.req.json();
		const validatedData = fingerprintRegistrationSchema.parse(body);

		// Check if fingerprint is already registered
		const existingFingerprint = await Fingerprint.findOne({
			fingerprintId: validatedData.fingerprintId,
		});
		if (existingFingerprint) {
			return c.json(
				{
					success: false,
					message: "Fingerprint is already registered",
					data: {
						fingerprintId: existingFingerprint.fingerprintId,
						name: existingFingerprint.name,
						department: existingFingerprint.department,
					},
				},
				409
			);
		}

		// Create new fingerprint registration
		const newFingerprint = new Fingerprint(validatedData);
		await newFingerprint.save();

		logger.info(
			{
				action: "FINGERPRINT_REGISTRATION",
				fingerprintId: validatedData.fingerprintId,
				name: validatedData.name,
				department: validatedData.department,
			},
			"New fingerprint registered"
		);

		return c.json(
			{
				success: true,
				message: "Fingerprint registered successfully",
				data: {
					fingerprintId: newFingerprint.fingerprintId,
					name: newFingerprint.name,
					department: newFingerprint.department,
					isActive: newFingerprint.isActive,
					createdAt: newFingerprint.createdAt,
				},
			},
			201
		);
	} catch (error: any) {
		logger.error({ error: error.message }, "Error registering fingerprint");

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
					message: "Fingerprint is already registered",
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

export const markFingerprintAttendance = async (c: Context) => {
	try {
		const body = await c.req.json();
		const validatedData = fingerprintAttendanceSchema.parse(body);

		// Check if fingerprint is registered
		const fingerprint = await Fingerprint.findOne({
			fingerprintId: validatedData.fingerprintId,
			isActive: true,
		});

		if (!fingerprint) {
			return c.json(
				{
					success: false,
					message: "Fingerprint not found or inactive",
				},
				404
			);
		}

		// Create attendance record
		const attendanceRecord = new FingerprintAttendance({
			fingerprintId: fingerprint.fingerprintId,
			name: fingerprint.name,
			department: fingerprint.department,
		});

		await attendanceRecord.save();

		logger.info(
			{
				action: "FINGERPRINT_ATTENDANCE_MARKED",
				fingerprintId: fingerprint.fingerprintId,
				name: fingerprint.name,
				department: fingerprint.department,
			},
			"Fingerprint attendance marked"
		);

		return c.json(
			{
				success: true,
				message: "Attendance marked successfully",
				data: {
					fingerprintId: attendanceRecord.fingerprintId,
					name: attendanceRecord.name,
					department: attendanceRecord.department,
					timestamp: attendanceRecord.timestamp,
				},
			},
			201
		);
	} catch (error: any) {
		logger.error(
			{ error: error.message },
			"Error marking fingerprint attendance"
		);

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

export const checkFingerprint = async (c: Context) => {
	try {
		const { fingerprintId } = c.req.param();
		const validatedParam = fingerprintIdParamSchema.parse({ fingerprintId });

		const fingerprint = await Fingerprint.findOne({
			fingerprintId: validatedParam.fingerprintId,
			isActive: true,
		});

		if (!fingerprint) {
			return c.json(
				{
					success: false,
					message: "Fingerprint not found",
					registered: false,
				},
				404
			);
		}

		return c.json(
			{
				success: true,
				message: "Fingerprint found",
				registered: true,
				data: {
					fingerprintId: fingerprint.fingerprintId,
					name: fingerprint.name,
					department: fingerprint.department,
					isActive: fingerprint.isActive,
					createdAt: fingerprint.createdAt,
				},
			},
			200
		);
	} catch (error: any) {
		logger.error(
			{ error: error.message, fingerprintId: c.req.param("fingerprintId") },
			"Error checking fingerprint"
		);

		if (error.name === "ZodError") {
			return c.json(
				{
					success: false,
					message: "Invalid fingerprint ID format",
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

export const getAllFingerprints = async (c: Context) => {
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
				{ fingerprintId: new RegExp(search, "i") },
			];
		}

		const skip = (page - 1) * limit;

		const [fingerprints, total] = await Promise.all([
			Fingerprint.find(filter)
				.select("-__v")
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit),
			Fingerprint.countDocuments(filter),
		]);

		return c.json(
			{
				success: true,
				message: "Fingerprints retrieved successfully",
				data: {
					fingerprints,
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
		logger.error({ error: error.message }, "Error getting fingerprints");

		return c.json(
			{
				success: false,
				message: "Internal server error",
			},
			500
		);
	}
};

export const getFingerprintAttendanceHistory = async (c: Context) => {
	try {
		const page = parseInt(c.req.query("page") || "1");
		const limit = parseInt(c.req.query("limit") || "10");
		const department = c.req.query("department");
		const fingerprintId = c.req.query("fingerprintId");
		const startDate = c.req.query("startDate");
		const endDate = c.req.query("endDate");

		const filter: any = {};

		if (department) {
			filter.department = new RegExp(department, "i");
		}

		if (fingerprintId) {
			filter.fingerprintId = fingerprintId;
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
			FingerprintAttendance.find(filter)
				.select("-__v")
				.sort({ timestamp: -1 })
				.skip(skip)
				.limit(limit),
			FingerprintAttendance.countDocuments(filter),
		]);

		return c.json(
			{
				success: true,
				message: "Fingerprint attendance history retrieved successfully",
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
		logger.error(
			{ error: error.message },
			"Error getting fingerprint attendance history"
		);

		return c.json(
			{
				success: false,
				message: "Internal server error",
			},
			500
		);
	}
};
