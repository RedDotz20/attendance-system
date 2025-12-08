import type { Context } from "hono";
import { mqttService } from "@/shared/services/mqtt.service.js";
import { logger } from "@/shared/utils/logger.js";

/**
 * Send command to device to change mode
 */
export const setDeviceMode = async (c: Context) => {
    try {
        const { deviceId, mode } = await c.req.json();

        if (!deviceId || !mode) {
            return c.json(
                {
                    error: "Missing required fields",
                    details: "deviceId and mode are required",
                },
                400
            );
        }

        if (mode !== "register" && mode !== "attendance") {
            return c.json(
                {
                    error: "Invalid mode",
                    details: "Mode must be either 'register' or 'attendance'",
                },
                400
            );
        }

        logger.info(`Setting device ${deviceId} to ${mode} mode`);

        // Publish command to MQTT
        const command = {
            device_id: deviceId,
            command: "set_mode",
            mode: mode,
            timestamp: new Date().toISOString(),
        };

        const success = mqttService.publish("attendance/device/control", command);

        if (!success) {
            return c.json(
                {
                    error: "Failed to publish command",
                    details: "MQTT service not connected",
                },
                500
            );
        }

        logger.info(`✅ Mode change command sent to device ${deviceId}`);

        return c.json(
            {
                message: "Command sent successfully",
                data: {
                    deviceId,
                    mode,
                    command: "set_mode",
                },
            },
            200
        );
    } catch (error: any) {
        logger.error(`❌ Error setting device mode: ${error.message}`);
        return c.json(
            {
                error: "Failed to set device mode",
                details: error.message,
            },
            500
        );
    }
};

/**
 * Request device status
 */
export const getDeviceStatus = async (c: Context) => {
    try {
        const deviceId = c.req.param("deviceId");

        if (!deviceId) {
            return c.json(
                {
                    error: "Device ID is required",
                },
                400
            );
        }

        logger.info(`Requesting status from device ${deviceId}`);

        // Publish status request to MQTT
        const command = {
            device_id: deviceId,
            command: "get_status",
            timestamp: new Date().toISOString(),
        };

        const success = mqttService.publish("attendance/device/control", command);

        if (!success) {
            return c.json(
                {
                    error: "Failed to request device status",
                    details: "MQTT service not connected",
                },
                500
            );
        }

        return c.json(
            {
                message: "Status request sent",
                data: {
                    deviceId,
                    note: "Device will respond via MQTT on attendance/device/response topic",
                },
            },
            200
        );
    } catch (error: any) {
        logger.error(`❌ Error requesting device status: ${error.message}`);
        return c.json(
            {
                error: "Failed to request device status",
                details: error.message,
            },
            500
        );
    }
};

/**
 * Send registration data to device
 */
export const sendRegistrationData = async (c: Context) => {
    try {
        const { deviceId, name, department } = await c.req.json();

        if (!deviceId || !name || !department) {
            return c.json(
                {
                    error: "Missing required fields",
                    details: "deviceId, name, and department are required",
                },
                400
            );
        }

        logger.info(`Sending registration data to device ${deviceId}: ${name}, ${department}`);

        // Publish registration data to MQTT
        const command = {
            device_id: deviceId,
            command: "set_registration_data",
            name: name,
            department: department,
            timestamp: new Date().toISOString(),
        };

        const success = mqttService.publish("attendance/device/control", command);

        if (!success) {
            return c.json(
                {
                    error: "Failed to send registration data",
                    details: "MQTT service not connected",
                },
                500
            );
        }

        logger.info(`✅ Registration data sent to device ${deviceId}`);

        return c.json(
            {
                message: "Registration data sent successfully",
                data: {
                    deviceId,
                    name,
                    department,
                },
            },
            200
        );
    } catch (error: any) {
        logger.error(`❌ Error sending registration data: ${error.message}`);
        return c.json(
            {
                error: "Failed to send registration data",
                details: error.message,
            },
            500
        );
    }
};

/**
 * Broadcast command to all devices
 */
export const broadcastToAllDevices = async (c: Context) => {
    try {
        const { command, mode } = await c.req.json();

        if (!command) {
            return c.json(
                {
                    error: "Command is required",
                },
                400
            );
        }

        logger.info(`Broadcasting command to all devices: ${command}`);

        // Publish command to all devices
        const payload: any = {
            device_id: "all",
            command: command,
            timestamp: new Date().toISOString(),
        };

        if (mode) {
            payload.mode = mode;
        }

        const success = mqttService.publish("attendance/device/control", payload);

        if (!success) {
            return c.json(
                {
                    error: "Failed to broadcast command",
                    details: "MQTT service not connected",
                },
                500
            );
        }

        logger.info(`✅ Command broadcast to all devices`);

        return c.json(
            {
                message: "Command broadcast successfully",
                data: payload,
            },
            200
        );
    } catch (error: any) {
        logger.error(`❌ Error broadcasting command: ${error.message}`);
        return c.json(
            {
                error: "Failed to broadcast command",
                details: error.message,
            },
            500
        );
    }
};
