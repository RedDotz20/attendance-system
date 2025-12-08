/**
 * Real-time Attendance Component
 * Connects to MQTT broker via WebSockets to display live attendance events
 */

import React, { useState, useEffect, useCallback } from "react";
import mqtt from "mqtt";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface AttendanceEvent {
	device_id: string;
	fingerprint_id: number;
	timestamp: number;
	event_type: string;
	user_name?: string;
	department?: string;
}

interface DeviceStatus {
	device_id: string;
	status: "online" | "offline";
	timestamp: number;
}

interface MqttConnectionStatus {
	connected: boolean;
	error: string | undefined;
	reconnecting: boolean;
}

export const RealTimeAttendance: React.FC = () => {
	const [events, setEvents] = useState<AttendanceEvent[]>([]);
	const [deviceStatuses, setDeviceStatuses] = useState<
		Map<string, DeviceStatus>
	>(new Map());
	const [connectionStatus, setConnectionStatus] =
		useState<MqttConnectionStatus>({
			connected: false,
			reconnecting: false,
			error: undefined,
		});
	const [client, setClient] = useState<mqtt.MqttClient | null>(null);

	// MQTT broker WebSocket URL - adjust according to your broker configuration
	const MQTT_BROKER_WS_URL =
		import.meta.env["VITE_MQTT_WS_URL"] || "ws://localhost:9001";
	const MQTT_USERNAME = import.meta.env["VITE_MQTT_USERNAME"] || "";
	const MQTT_PASSWORD = import.meta.env["VITE_MQTT_PASSWORD"] || "";

	const connectToMQTT = useCallback(() => {
		try {
			setConnectionStatus((prev) => ({
				...prev,
				reconnecting: true,
				error: undefined,
			}));

			// Create MQTT client with WebSocket transport
			const mqttOptions: mqtt.IClientOptions = {
				clientId: `react-client-${Date.now()}`,
				clean: true,
				connectTimeout: 10000,
				protocol: MQTT_BROKER_WS_URL.startsWith("wss://") ? "wss" : "ws",
				reconnectPeriod: 5000,
			};

			// Add authentication if credentials are provided (for HiveMQ Cloud)
			if (MQTT_USERNAME && MQTT_PASSWORD) {
				mqttOptions.username = MQTT_USERNAME;
				mqttOptions.password = MQTT_PASSWORD;
			}

			const mqttClient = mqtt.connect(MQTT_BROKER_WS_URL, mqttOptions);

			mqttClient.on("connect", () => {
				console.log("Connected to MQTT broker via WebSocket");
				setConnectionStatus({
					connected: true,
					reconnecting: false,
					error: undefined,
				});

				// Subscribe to attendance events and device status
				mqttClient.subscribe("attendance/events", (err) => {
					if (err) {
						console.error("Failed to subscribe to attendance/events:", err);
					} else {
						console.log("Subscribed to attendance/events");
					}
				});

				mqttClient.subscribe("attendance/device/status", (err) => {
					if (err) {
						console.error(
							"Failed to subscribe to attendance/device/status:",
							err
						);
					} else {
						console.log("Subscribed to attendance/device/status");
					}
				});
			});

			mqttClient.on("error", (error) => {
				console.error("MQTT connection error:", error);
				setConnectionStatus({
					connected: false,
					reconnecting: false,
					error: error.message,
				});
			});

			mqttClient.on("close", () => {
				console.log("MQTT connection closed");
				setConnectionStatus((prev) => ({ ...prev, connected: false }));
			});

			mqttClient.on("reconnect", () => {
				console.log("Attempting to reconnect to MQTT broker");
				setConnectionStatus((prev) => ({ ...prev, reconnecting: true }));
			});

			mqttClient.on("message", (topic, payload) => {
				try {
					const message = payload.toString();
					const data = JSON.parse(message);

					console.log("Received MQTT message:", { topic, data });

					switch (topic) {
						case "attendance/events":
							handleAttendanceEvent(data);
							break;
						case "attendance/device/status":
							handleDeviceStatus(data);
							break;
						default:
							console.warn("Received message from unknown topic:", topic);
					}
				} catch (error) {
					console.error("Failed to parse MQTT message:", error);
				}
			});

			setClient(mqttClient);
		} catch (error) {
			console.error("Failed to create MQTT client:", error);
			setConnectionStatus({
				connected: false,
				reconnecting: false,
				error: "Failed to create MQTT connection",
			});
		}
	}, [MQTT_BROKER_WS_URL]);

	const handleAttendanceEvent = useCallback((data: AttendanceEvent) => {
		const event: AttendanceEvent = {
			device_id: data.device_id,
			fingerprint_id: data.fingerprint_id,
			timestamp: data.timestamp,
			event_type: data.event_type,
			...(data.user_name && { user_name: data.user_name }),
			...(data.department && { department: data.department }),
		};

		setEvents((prevEvents) => {
			// Deduplication: Check if an identical event already exists within the last 5 seconds
			// Matches on fingerprint_id, event_type, and timestamp window
			const isDuplicate = prevEvents.some(
				(existingEvent) =>
					existingEvent.fingerprint_id === event.fingerprint_id &&
					existingEvent.event_type === event.event_type &&
					Math.abs(event.timestamp - existingEvent.timestamp) < 5000 // Within 5 seconds
			);

			if (isDuplicate) {
				console.log(
					`Duplicate attendance event for fingerprint ${event.fingerprint_id}, skipping...`
				);
				return prevEvents;
			}

			const newEvents = [event, ...prevEvents];
			// Keep only the last 50 events to prevent memory issues
			return newEvents.slice(0, 50);
		});
	}, []);

	const handleDeviceStatus = useCallback((data: DeviceStatus) => {
		const status: DeviceStatus = {
			device_id: data.device_id,
			status: data.status,
			timestamp: data.timestamp,
		};

		setDeviceStatuses((prevStatuses) => {
			const newStatuses = new Map(prevStatuses);
			newStatuses.set(status.device_id, status);
			return newStatuses;
		});
	}, []);

	const disconnect = useCallback(() => {
		if (client) {
			client.end();
			setClient(null);
			setConnectionStatus({
				connected: false,
				reconnecting: false,
				error: undefined,
			});
		}
	}, [client]);

	const clearEvents = useCallback(() => {
		setEvents([]);
	}, []);

	useEffect(() => {
		connectToMQTT();

		// Cleanup on unmount
		return () => {
			if (client) {
				client.end();
			}
		};
	}, [connectToMQTT]);

	const formatTimestamp = (timestamp: number) => {
		return new Date(timestamp).toLocaleString();
	};

	const getStatusBadgeVariant = (status: string) => {
		return status === "online" ? "default" : "destructive";
	};

	return (
		<div className="space-y-6">
			{/* Connection Status */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center justify-between">
						<span>MQTT Connection Status</span>
						<div className="flex gap-2">
							<Badge
								variant={connectionStatus.connected ? "default" : "destructive"}
							>
								{connectionStatus.connected ? "Connected" : "Disconnected"}
							</Badge>
							{connectionStatus.reconnecting && (
								<Badge variant="secondary">Reconnecting...</Badge>
							)}
						</div>
					</CardTitle>
					{connectionStatus.error && (
						<Alert>
							<AlertDescription>{connectionStatus.error}</AlertDescription>
						</Alert>
					)}
					<div className="flex gap-2">
						<Button
							onClick={connectToMQTT}
							disabled={
								connectionStatus.connected || connectionStatus.reconnecting
							}
							size="sm"
						>
							{connectionStatus.reconnecting ? "Connecting..." : "Connect"}
						</Button>
						<Button
							onClick={disconnect}
							disabled={!connectionStatus.connected}
							variant="outline"
							size="sm"
						>
							Disconnect
						</Button>
					</div>
				</CardHeader>
			</Card>

			{/* Device Status */}
			<Card>
				<CardHeader>
					<CardTitle>Device Status</CardTitle>
					<CardDescription>
						Real-time status of connected attendance devices
					</CardDescription>
				</CardHeader>
				<CardContent>
					{deviceStatuses.size === 0 ? (
						<p className="text-muted-foreground">No devices connected</p>
					) : (
						<div className="space-y-2">
							{Array.from(deviceStatuses.values()).map((device) => (
								<div
									key={device.device_id}
									className="flex items-center justify-between p-2 border rounded"
								>
									<div>
										<span className="font-medium">{device.device_id}</span>
										<p className="text-sm text-muted-foreground">
											Last seen: {formatTimestamp(device.timestamp)}
										</p>
									</div>
									<Badge variant={getStatusBadgeVariant(device.status)}>
										{device.status}
									</Badge>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Real-time Events */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span>Real-time Attendance Events</span>
						<div className="flex gap-2">
							<Badge variant="outline">{events.length} events</Badge>
							<Button
								onClick={clearEvents}
								variant="outline"
								size="sm"
							>
								Clear
							</Button>
						</div>
					</CardTitle>
					<CardDescription>
						Live attendance events from connected devices
					</CardDescription>
				</CardHeader>
				<CardContent>
					{events.length === 0 ? (
						<div className="text-center py-8">
							<p className="text-muted-foreground">
								No attendance events received yet
							</p>
							<p className="text-sm text-muted-foreground mt-1">
								Events will appear here when fingerprints are scanned on
								connected devices
							</p>
						</div>
					) : (
						<div className="space-y-3 max-h-96 overflow-y-auto">
							{events.map((event, index) => (
								<div
									key={`${event.device_id}-${event.timestamp}-${index}`}
									className="border rounded-lg p-3"
								>
									<div className="flex items-center justify-between mb-2">
										<div className="flex items-center gap-2">
											<Badge variant="outline">
												Fingerprint ID: {event.fingerprint_id}
											</Badge>
											<Badge variant="secondary">{event.device_id}</Badge>
										</div>
										<span className="text-sm text-muted-foreground">
											{formatTimestamp(event.timestamp)}
										</span>
									</div>

									{(event.user_name || event.department) && (
										<>
											<Separator className="my-2" />
											<div className="grid grid-cols-2 gap-2 text-sm">
												{event.user_name && (
													<div>
														<span className="font-medium">Name: </span>
														{event.user_name}
													</div>
												)}
												{event.department && (
													<div>
														<span className="font-medium">Department: </span>
														{event.department}
													</div>
												)}
											</div>
										</>
									)}
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default RealTimeAttendance;
