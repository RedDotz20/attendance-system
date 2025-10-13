import type { Context } from "hono";
import { Fingerprint } from "../models/fingerprint.model.js";
import { FingerprintAttendance } from "../models/attendance.model.js";
import { logger } from "@/shared/utils/logger.js";
import { mqttService } from "@/shared/services/mqtt.service.js";

export const registerFingerprint = async (c: Context) => {
    try {
        // Log incoming request details
        logger.info("=== FINGERPRINT REGISTRATION REQUEST ===");
        logger.info(`Method: ${c.req.method}`);
        logger.info(`Path: ${c.req.path}`);
        logger.info(`Headers: ${JSON.stringify(Object.fromEntries(c.req.raw.headers))}`);

        const body = await c.req.json();
        logger.info(`Body: ${JSON.stringify(body)}`);

        const { fingerprintId, name, department } = body;

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

        const { fingerprintId } = body;

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

        // Publish MQTT event for real-time updates
        mqttService.publish("attendance/events", {
            event_type: "attendance",
            fingerprint_id: fingerprintId,
            name: fingerprint.name,
            department: fingerprint.department,
            timestamp: new Date().toISOString(),
        });

        logger.info(`📡 MQTT attendance event published for ${fingerprintId}`);

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
                count: fingerprints.length,
                fingerprints,
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
        const attendance = await FingerprintAttendance.find().sort({
            timestamp: -1,
        });

        logger.info(`Retrieved ${attendance.length} attendance records`);
        return c.json(
            {
                message: "Attendance records retrieved successfully",
                count: attendance.length,
                attendance,
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
