/**
 * MQTT Service for real-time attendance events
 * Handles MQTT connection and message processing
 */

import mqtt from "mqtt";
import { logger } from "@/shared/utils/logger.js";

export interface AttendanceEvent {
	device_id: string;
	fingerprint_id: number;
	timestamp: number;
	event_type: string;
	user_name?: string;
	department?: string;
}

export interface DeviceStatus {
	device_id: string;
	status: "online" | "offline";
	timestamp: number;
}

export class MQTTService {
	private client: mqtt.MqttClient | null = null;
	private isConnected = false;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectInterval = 5000; // 5 seconds

	// Event handlers
	private attendanceEventHandlers: Array<(event: AttendanceEvent) => void> = [];
	private deviceStatusHandlers: Array<(status: DeviceStatus) => void> = [];

	constructor(
		private brokerUrl: string = process.env["MQTT_BROKER_URL"] ||
			"mqtts://localhost:8883",
		private clientId: string = process.env["MQTT_CLIENT_ID"] ||
			`hono-server-${Date.now()}`,
		private username: string = process.env["MQTT_USERNAME"] || "",
		private password: string = process.env["MQTT_PASSWORD"] || ""
	) {}

	/**
	 * Connect to MQTT broker
	 */
	async connect(): Promise<void> {
		return new Promise((resolve, reject) => {
			try {
				logger.info(`Connecting to MQTT broker at ${this.brokerUrl}`);

				// Connection options for HiveMQ Cloud
				const connectionOptions: mqtt.IClientOptions = {
					clientId: this.clientId,
					clean: true,
					connectTimeout: 10000,
					reconnectPeriod: 0, // Disable auto reconnect, we'll handle it manually
				};

				// Add authentication if username and password are provided (HiveMQ Cloud)
				if (this.username && this.password) {
					connectionOptions.username = this.username;
					connectionOptions.password = this.password;
					logger.info("Using MQTT authentication credentials");
				}

				// Configure TLS for secure connections (mqtts://)
				if (this.brokerUrl.startsWith('mqtts://')) {
					connectionOptions.protocol = 'mqtts';
					connectionOptions.port = 8883;
					logger.info("Using secure MQTT connection (TLS)");
				}

				this.client = mqtt.connect(this.brokerUrl, connectionOptions);

				this.client.on("connect", () => {
					logger.info("Connected to MQTT broker successfully");
					this.isConnected = true;
					this.reconnectAttempts = 0;
					this.subscribeToTopics();
					resolve();
				});

				this.client.on("error", (error) => {
					logger.error(`MQTT connection error: ${error.message}`);
					this.isConnected = false;
					if (this.reconnectAttempts === 0) {
						reject(error);
					}
				});

				this.client.on("close", () => {
					logger.warn("MQTT connection closed");
					this.isConnected = false;
					this.handleReconnect();
				});

				this.client.on("message", (topic, payload) => {
					this.handleMessage(topic, payload);
				});
			} catch (error) {
				logger.error("Failed to create MQTT client");
				reject(error);
			}
		});
	}

	/**
	 * Subscribe to required topics
	 * Note: Server subscribes to receive events from ESP32 devices
	 * Server also publishes to these topics for web client consumption
	 */
	private subscribeToTopics(): void {
		if (!this.client || !this.isConnected) return;

		const topics = [
			"attendance/events",
			"attendance/device/status",
			"attendance/device/response", // Device responses to commands
		];

		topics.forEach((topic) => {
			this.client!.subscribe(topic, (err) => {
				if (err) {
					logger.error(`Failed to subscribe to topic ${topic}: ${err.message}`);
				} else {
					logger.info(`Subscribed to topic: ${topic}`);
				}
			});
		});
	}

	/**
	 * Handle incoming MQTT messages
	 */
	private handleMessage(topic: string, payload: Buffer): void {
		try {
			const message = payload.toString();
			logger.info(`Received MQTT message from ${topic}: ${message}`);

			const data = JSON.parse(message);

			switch (topic) {
				case "attendance/events":
					this.handleAttendanceEvent(data);
					break;
				case "attendance/device/status":
					this.handleDeviceStatus(data);
					break;
				case "attendance/device/response":
					this.handleDeviceResponse(data);
					break;
				default:
					logger.warn(`Received message from unknown topic: ${topic}`);
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			logger.error(
				`Failed to process MQTT message from ${topic}: ${errorMessage}`
			);
		}
	}

	/**
	 * Handle attendance event
	 */
	private handleAttendanceEvent(data: any): void {
		try {
			const event: AttendanceEvent = {
				device_id: data.device_id,
				fingerprint_id: data.fingerprint_id,
				timestamp: data.timestamp,
				event_type: data.event_type,
				user_name: data.user_name,
				department: data.department,
			};

			logger.info(
				`Processing attendance event - Device: ${event.device_id}, Fingerprint: ${event.fingerprint_id}, Type: ${event.event_type}`
			);

			// Notify all registered handlers
			this.attendanceEventHandlers.forEach((handler) => {
				try {
					handler(event);
				} catch (error) {
					logger.error("Error in attendance event handler");
				}
			});
		} catch (error) {
			logger.error("Failed to process attendance event");
		}
	}

	/**
	 * Handle device status update
	 */
	private handleDeviceStatus(data: any): void {
		try {
			const status: DeviceStatus = {
				device_id: data.device_id,
				status: data.status,
				timestamp: data.timestamp,
			};

			logger.info(
				`Processing device status - Device: ${status.device_id}, Status: ${status.status}`
			);

			// Notify all registered handlers
			this.deviceStatusHandlers.forEach((handler) => {
				try {
					handler(status);
				} catch (error) {
					logger.error("Error in device status handler");
				}
			});
		} catch (error) {
			logger.error("Failed to process device status");
		}
	}

	/**
	 * Handle device response (to commands)
	 */
	private handleDeviceResponse(data: any): void {
		try {
			logger.info(
				`Device response received from ${data.device_id}: ${data.message || data.status}`
			);

			// Log the full response for debugging
			logger.info({ response: data }, "Device response details");

			// You can add specific response handlers here if needed
		} catch (error) {
			logger.error("Failed to process device response");
		}
	}

	/**
	 * Handle reconnection logic
	 */
	private handleReconnect(): void {
		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			logger.error("Max reconnection attempts reached, giving up");
			return;
		}

		this.reconnectAttempts++;
		logger.info(
			`Attempting to reconnect to MQTT broker (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
		);

		setTimeout(() => {
			this.connect().catch((error) => {
				const errorMessage =
					error instanceof Error ? error.message : "Unknown error";
				logger.error(`Reconnection attempt failed: ${errorMessage}`);
			});
		}, this.reconnectInterval);
	}

	/**
	 * Publish a message to a topic
	 * This publishes events to MQTT broker which are then consumed by:
	 * 1. Web clients via WebSocket for real-time updates
	 * 2. Other subscribed services/devices
	 */
	publish(topic: string, message: string | object): boolean {
		if (!this.client || !this.isConnected) {
			logger.warn(
				{
					topic,
					isConnected: this.isConnected,
					hasClient: !!this.client,
				},
				"Cannot publish message, MQTT client not connected"
			);
			return false;
		}

		const payload =
			typeof message === "string" ? message : JSON.stringify(message);

		this.client.publish(topic, payload, { qos: 1, retain: false }, (err) => {
			if (err) {
				logger.error(
					{ topic, error: err.message },
					`Failed to publish message to ${topic}`
				);
			} else {
				logger.info({ topic, payload }, `Message published successfully to ${topic}`);
			}
		});

		return true;
	}

	/**
	 * Register attendance event handler
	 */
	onAttendanceEvent(handler: (event: AttendanceEvent) => void): void {
		this.attendanceEventHandlers.push(handler);
	}

	/**
	 * Register device status handler
	 */
	onDeviceStatus(handler: (status: DeviceStatus) => void): void {
		this.deviceStatusHandlers.push(handler);
	}

	/**
	 * Disconnect from MQTT broker
	 */
	disconnect(): void {
		if (this.client) {
			this.client.end();
			this.isConnected = false;
			logger.info("Disconnected from MQTT broker");
		}
	}

	/**
	 * Get connection status
	 */
	isConnectedToBroker(): boolean {
		return this.isConnected;
	}
}

// Singleton instance
export const mqttService = new MQTTService();
