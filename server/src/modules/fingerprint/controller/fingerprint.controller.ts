import type { Context } from "hono";
import { Fingerprint } from "../models/fingerprint.model.js";
import { FingerprintAttendance } from "../models/attendance.model.js";
import { AttendanceLog } from "../models/attendance-log.model.js";
import { logger } from "@/shared/utils/logger.js";
import { mqttService } from "@/shared/services/mqtt.service.js";
import {
    fingerprintRegistrationSchema,
    fingerprintAttendanceSchema,
} from "../validators/fingerprint.validator.js";

export const registerFingerprint = async (c: Context) => {
    try {
        // Log incoming request details
        logger.info("=== FINGERPRINT REGISTRATION REQUEST ===");
        logger.info(`Method: ${c.req.method}`);
        logger.info(`Path: ${c.req.path}`);
        logger.info(`Headers: ${JSON.stringify(Object.fromEntries(c.req.raw.headers))}`);

        const body = await c.req.json();
        logger.info(`Body: ${JSON.stringify(body)}`);

        // Validate input
        const validationResult = fingerprintRegistrationSchema.safeParse(body);
        if (!validationResult.success) {
            logger.warn(`Validation failed: ${JSON.stringify(validationResult.error.flatten())}`);
            return c.json(
                {
                    error: "Validation failed",
                    details: validationResult.error.flatten().fieldErrors,
                },
                400
            );
        }

        const { fingerprintId, name, department } = validationResult.data;

        // Check if fingerprint already exists
        const existingFingerprint = await Fingerprint.findOne({ fingerprintId });
        if (existingFingerprint) {
            logger.warn(`Fingerprint ID ${fingerprintId} already registered`);
            return c.json(
                {
                    error: "Fingerprint already registered",
                    fingerprint: existingFingerprint,
                },
                409
            );
        }

        // Create new fingerprint
        const fingerprint = new Fingerprint({
            fingerprintId,
            name,
            department,
        });

        await fingerprint.save();
        logger.info(`✅ Fingerprint registered: ID=${fingerprintId}, Name=${name}`);

        // Create attendance log entry for registration event
        const registrationLog = new AttendanceLog({
            fingerprintId,
            name,
            department,
            timestamp: new Date(),
            eventType: "registration",
        });

        await registrationLog.save();

        // Publish MQTT event for real-time updates
        mqttService.publish("attendance/events", {
            event_type: "registration",
            fingerprint_id: fingerprintId,
            name: name,
            department: department,
            timestamp: new Date().toISOString(),
        });

        logger.info(`📡 MQTT registration event published for ${fingerprintId}`);

        return c.json(
            {
                message: "Fingerprint registered successfully",
                fingerprint,
            },
            201
        );
    } catch (error: any) {
        logger.error(`❌ Registration error: ${error.message}`);
        logger.error(`Stack: ${error.stack}`);
        return c.json(
            {
                error: "Failed to register fingerprint",
                details: error.message,
            },
            500
        );
    }
};

export const markFingerprintAttendance = async (c: Context) => {
    try {
        // Log incoming request details
        logger.info("=== ATTENDANCE MARKING REQUEST ===");
        logger.info(`Method: ${c.req.method}`);
        logger.info(`Path: ${c.req.path}`);
        logger.info(`Headers: ${JSON.stringify(Object.fromEntries(c.req.raw.headers))}`);

        const body = await c.req.json();
        logger.info(`Body: ${JSON.stringify(body)}`);

        // Validate input
        const validationResult = fingerprintAttendanceSchema.safeParse(body);
        if (!validationResult.success) {
            logger.warn(`Validation failed: ${JSON.stringify(validationResult.error.flatten())}`);
            return c.json(
                {
                    error: "Validation failed",
                    details: validationResult.error.flatten().fieldErrors,
                },
                400
            );
        }

        const { fingerprintId } = validationResult.data;

        // Check if fingerprint is registered
        const fingerprint = await Fingerprint.findOne({
            fingerprintId,
            isActive: true,
        });

        if (!fingerprint) {
            logger.warn(`Attendance attempted with unregistered fingerprint: ${fingerprintId}`);
            return c.json(
                {
                    error: "Fingerprint not registered",
                    message: "Please register this fingerprint first",
                },
                404
            );
        }

        // Create attendance record
        const attendanceRecord = new FingerprintAttendance({
            fingerprintId: fingerprint.fingerprintId,
            name: fingerprint.name,
            department: fingerprint.department,
            timestamp: new Date(),
        });

        await attendanceRecord.save();
        logger.info(`✅ Attendance marked for ${fingerprint.name} (ID: ${fingerprintId})`);

        // Create attendance log entry for tracking
        const attendanceLog = new AttendanceLog({
            fingerprintId: fingerprint.fingerprintId,
            name: fingerprint.name,
            department: fingerprint.department,
            timestamp: new Date(),
            eventType: "attendance",
        });

        await attendanceLog.save();

        // Note: MQTT event is already published by the firmware device
        // Server only creates the database record and responds to the HTTP request

        return c.json(
            {
                message: "Attendance marked successfully",
                attendance: attendanceRecord,
                user: {
                    name: fingerprint.name,
                    department: fingerprint.department,
                },
            },
            201
        );
    } catch (error: any) {
        logger.error(`❌ Attendance marking error: ${error.message}`);
        logger.error(`Stack: ${error.stack}`);
        return c.json(
            {
                error: "Failed to mark attendance",
                details: error.message,
            },
            500
        );
    }
};

export const checkFingerprintRegistration = async (c: Context) => {
    try {
        logger.info("=== FINGERPRINT CHECK REQUEST ===");
        const fingerprintId = c.req.param("id");
        logger.info(`Checking fingerprint ID: ${fingerprintId}`);

        const fingerprint = await Fingerprint.findOne({
            fingerprintId,
            isActive: true,
        });

        if (!fingerprint) {
            logger.info(`Fingerprint ${fingerprintId} not found or inactive`);
            return c.json(
                {
                    registered: false,
                    message: "Fingerprint not registered",
                },
                404
            );
        }

        logger.info(`✅ Fingerprint ${fingerprintId} found: ${fingerprint.name}`);
        return c.json(
            {
                registered: true,
                fingerprint: {
                    fingerprintId: fingerprint.fingerprintId,
                    name: fingerprint.name,
                    department: fingerprint.department,
                },
            },
            200
        );
    } catch (error: any) {
        logger.error(`❌ Check error: ${error.message}`);
        return c.json(
            {
                error: "Failed to check fingerprint registration",
                details: error.message,
            },
            500
        );
    }
};

export const getAllFingerprints = async (c: Context) => {
    try {
        const fingerprints = await Fingerprint.find({ isActive: true }).sort({
            createdAt: -1,
        });

        logger.info(`Retrieved ${fingerprints.length} fingerprints`);
        return c.json(
            {
                message: "Fingerprints retrieved successfully",
                data: fingerprints,
                count: fingerprints.length,
                total: fingerprints.length,
            },
            200
        );
    } catch (error: any) {
        logger.error(`Error retrieving fingerprints: ${error.message}`);
        return c.json(
            {
                error: "Failed to retrieve fingerprints",
                details: error.message,
            },
            500
        );
    }
};

export const getFingerprintAttendance = async (c: Context) => {
    try {
        const { startDate, endDate, department, fingerprintId, page = "1", limit = "50" } = c.req.query();

        // Build filter query
        const filter: any = {};

        // Date range filter
        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) {
                filter.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                const endDateTime = new Date(endDate);
                endDateTime.setHours(23, 59, 59, 999); // Include full end date
                filter.timestamp.$lte = endDateTime;
            }
        }

        // Department filter
        if (department) {
            filter.department = department;
        }

        // Fingerprint ID filter
        if (fingerprintId) {
            filter.fingerprintId = fingerprintId;
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const [attendance, total] = await Promise.all([
            FingerprintAttendance.find(filter)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limitNum),
            FingerprintAttendance.countDocuments(filter),
        ]);

        logger.info(`Retrieved ${attendance.length} attendance records (page ${page})`);

        return c.json(
            {
                message: "Attendance records retrieved successfully",
                data: attendance,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(total / limitNum),
                    totalItems: total,
                    totalRecords: total,
                    itemsPerPage: limitNum,
                    limit: limitNum,
                    hasNextPage: pageNum < Math.ceil(total / limitNum),
                    hasPrevPage: pageNum > 1,
                },
            },
            200
        );
    } catch (error: any) {
        logger.error(`Error retrieving attendance: ${error.message}`);
        return c.json(
            {
                error: "Failed to retrieve attendance records",
                details: error.message,
            },
            500
        );
    }
};

// New endpoint: Get attendance statistics
export const getAttendanceStats = async (c: Context) => {
    try {
        const { startDate, endDate, department } = c.req.query();

        // Build filter query
        const filter: any = {};

        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) {
                filter.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                const endDateTime = new Date(endDate);
                endDateTime.setHours(23, 59, 59, 999);
                filter.timestamp.$lte = endDateTime;
            }
        }

        if (department) {
            filter.department = department;
        }

        // Aggregate statistics
        const [totalAttendance, uniqueUsers, departmentStats, dailyStats] = await Promise.all([
            // Total attendance count
            FingerprintAttendance.countDocuments(filter),

            // Unique users count
            FingerprintAttendance.distinct("fingerprintId", filter).then(ids => ids.length),

            // Department-wise breakdown
            FingerprintAttendance.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: "$department",
                        count: { $sum: 1 },
                        uniqueUsers: { $addToSet: "$fingerprintId" },
                    },
                },
                {
                    $project: {
                        department: "$_id",
                        count: 1,
                        uniqueUsers: { $size: "$uniqueUsers" },
                        _id: 0,
                    },
                },
                { $sort: { count: -1 } },
            ]),

            // Daily attendance trend
            FingerprintAttendance.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
                        },
                        count: { $sum: 1 },
                        uniqueUsers: { $addToSet: "$fingerprintId" },
                    },
                },
                {
                    $project: {
                        date: "$_id",
                        count: 1,
                        uniqueUsers: { $size: "$uniqueUsers" },
                        _id: 0,
                    },
                },
                { $sort: { date: 1 } },
                { $limit: 30 }, // Last 30 days
            ]),
        ]);

        logger.info("Attendance statistics generated successfully");

        return c.json(
            {
                message: "Statistics retrieved successfully",
                data: {
                    summary: {
                        totalAttendance,
                        uniqueUsers,
                    },
                    byDepartment: departmentStats,
                    dailyTrend: dailyStats,
                },
            },
            200
        );
    } catch (error: any) {
        logger.error(`Error generating statistics: ${error.message}`);
        return c.json(
            {
                error: "Failed to generate statistics",
                details: error.message,
            },
            500
        );
    }
};

// New endpoint: Get individual user attendance report
export const getUserAttendanceReport = async (c: Context) => {
    try {
        const fingerprintId = c.req.param("id");
        const { startDate, endDate } = c.req.query();

        // Build filter query
        const filter: any = { fingerprintId };

        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) {
                filter.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                const endDateTime = new Date(endDate);
                endDateTime.setHours(23, 59, 59, 999);
                filter.timestamp.$lte = endDateTime;
            }
        }

        const [fingerprint, attendanceRecords, totalCount] = await Promise.all([
            Fingerprint.findOne({ fingerprintId, isActive: true }),
            FingerprintAttendance.find(filter).sort({ timestamp: -1 }).limit(100),
            FingerprintAttendance.countDocuments(filter),
        ]);

        if (!fingerprint) {
            return c.json({ error: "Fingerprint not found" }, 404);
        }

        logger.info(`Generated report for fingerprint ${fingerprintId}: ${totalCount} records`);

        return c.json(
            {
                message: "User attendance report generated successfully",
                data: {
                    user: {
                        fingerprintId: fingerprint.fingerprintId,
                        name: fingerprint.name,
                        department: fingerprint.department,
                    },
                    attendance: {
                        total: totalCount,
                        records: attendanceRecords,
                    },
                },
            },
            200
        );
    } catch (error: any) {
        logger.error(`Error generating user report: ${error.message}`);
        return c.json(
            {
                error: "Failed to generate user report",
                details: error.message,
            },
            500
        );
    }
};

// New endpoint: Get attendance logs (real-time events)
export const getAttendanceLogs = async (c: Context) => {
    try {
        const { startDate, endDate, department, eventType, page = "1", limit = "100" } = c.req.query();

        // Build filter query
        const filter: any = {};

        // Date range filter
        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) {
                filter.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                const endDateTime = new Date(endDate);
                endDateTime.setHours(23, 59, 59, 999); // Include full end date
                filter.timestamp.$lte = endDateTime;
            }
        }

        // Department filter
        if (department) {
            filter.department = department;
        }

        // Event type filter
        if (eventType) {
            filter.eventType = eventType;
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const [logs, total] = await Promise.all([
            AttendanceLog.find(filter)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limitNum),
            AttendanceLog.countDocuments(filter),
        ]);

        logger.info(`Retrieved ${logs.length} attendance logs (page ${page})`);

        return c.json(
            {
                message: "Attendance logs retrieved successfully",
                data: logs,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(total / limitNum),
                    totalItems: total,
                    totalRecords: total,
                    itemsPerPage: limitNum,
                    limit: limitNum,
                    hasNextPage: pageNum < Math.ceil(total / limitNum),
                    hasPrevPage: pageNum > 1,
                },
            },
            200
        );
    } catch (error: any) {
        logger.error(`Error retrieving attendance logs: ${error.message}`);
        return c.json(
            {
                error: "Failed to retrieve attendance logs",
                details: error.message,
            },
            500
        );
    }
};
