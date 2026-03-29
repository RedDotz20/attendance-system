/**
 * Real-time Attendance Component with Persistent Logs
 * Displays attendance events from database with live MQTT updates
 */

import React, { useState, useEffect, useCallback } from "react";
import mqtt from "mqtt";
import { useQuery } from "@tanstack/react-query";
import { FingerprintService } from "@/features/fingerprint/services/fingerprint.service";
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
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";

interface AttendanceLog {
	_id: string;
	fingerprintId: string;
	name: string;
	department: string;
	timestamp: string;
	eventType: "attendance" | "registration" | "device_status";
	createdAt: string;
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
	const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState<string>("");

	// MQTT broker WebSocket URL - adjust according to your broker configuration
	const MQTT_BROKER_WS_URL =
		import.meta.env["VITE_MQTT_WS_URL"] || "ws://localhost:9001";
	const MQTT_USERNAME = import.meta.env["VITE_MQTT_USERNAME"] || "";
	const MQTT_PASSWORD = import.meta.env["VITE_MQTT_PASSWORD"] || "";

	// Fetch attendance logs from database
	const {
		data: logsData,
		isLoading: logsLoading,
		refetch: refetchLogs,
	} = useQuery({
		queryKey: ["attendance-logs", selectedDepartment],
		queryFn: () =>
			FingerprintService.getAttendanceLogs({
				...(selectedDepartment !== "all" && { department: selectedDepartment }),
				eventType: "attendance",
				limit: 200,
			}),
		staleTime: 5000,
		refetchInterval: 10000,
	});

	const logs = logsData?.data || [];

	// Filter logs based on search query
	const filteredLogs = searchQuery
		? logs.filter(
				(log: AttendanceLog) =>
					log.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					log.fingerprintId.includes(searchQuery)
		  )
		: logs;

	const connectToMQTT = useCallback(() => {
		try {
			setConnectionStatus((prev) => ({
				...prev,
				reconnecting: true,
				error: undefined,
			}));

			// Create MQTT client with WebSocket transport
			const mqttOptions: mqtt.IClientOptions = {
				clientId: `react-realtime-${Date.now()}`,
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
							// Refetch logs when new event arrives
							refetchLogs();
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

	useEffect(() => {
		connectToMQTT();

		// Cleanup on unmount
		return () => {
			if (client) {
				client.end();
			}
		};
	}, [connectToMQTT]);

	const formatTimestamp = (timestamp: string) => {
		return new Date(timestamp).toLocaleString();
	};

	const getStatusBadgeVariant = (status: string) => {
		return status === "online" ? "default" : "destructive";
	};

	// Get unique departments from logs for filter
	const departments = Array.from(
		new Set(logs.map((log: AttendanceLog) => log.department))
	);

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
											Last seen:{" "}
											{formatTimestamp(
												new Date(device.timestamp).toISOString()
											)}
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

			{/* Attendance Logs with Filters */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span>Attendance Logs</span>
						<Button
							onClick={() => refetchLogs()}
							variant="outline"
							size="sm"
						>
							<RefreshCw className="h-4 w-4 mr-2" />
							Refresh
						</Button>
					</CardTitle>
					<CardDescription>
						Real-time attendance events from the system with persistent logs
					</CardDescription>
				</CardHeader>
				<CardContent>
					{/* Filters */}
					<div className="flex gap-4 mb-6">
						<Input
							placeholder="Search by name or fingerprint ID..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="flex-1"
						/>
						<Select
							value={selectedDepartment}
							onValueChange={setSelectedDepartment}
						>
							<SelectTrigger className="w-48">
								<SelectValue placeholder="Filter by department" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Departments</SelectItem>
								{departments.map((dept) => (
									<SelectItem
										key={dept}
										value={dept}
									>
										{dept}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Logs Display */}
					{logsLoading ? (
						<div className="space-y-3">
							{[...Array(5)].map((_, i) => (
								<Skeleton
									key={i}
									className="h-20"
								/>
							))}
						</div>
					) : filteredLogs.length === 0 ? (
						<div className="text-center py-12">
							<AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
							<p className="text-muted-foreground">
								{logs.length === 0
									? "No attendance logs yet"
									: "No results matching your search"}
							</p>
						</div>
					) : (
						<div className="space-y-3 max-h-[600px] overflow-y-auto">
							{filteredLogs.map((log: AttendanceLog) => (
								<div
									key={log._id}
									className="border rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition"
								>
									<div className="flex items-center justify-between mb-2">
										<div className="flex items-center gap-3">
											<div>
												<h4 className="font-semibold text-base">{log.name}</h4>
												<p className="text-xs text-muted-foreground">
													{log.fingerprintId}
												</p>
											</div>
										</div>
										<div className="text-right">
											<Badge
												variant="outline"
												className="capitalize mb-1"
											>
												{log.eventType}
											</Badge>
											<p className="text-xs text-muted-foreground">
												{formatTimestamp(log.timestamp)}
											</p>
										</div>
									</div>
									<div className="flex gap-2">
										<Badge
											variant="secondary"
											className="text-xs"
										>
											{log.department}
										</Badge>
										<Badge
											variant="outline"
											className="text-xs"
										>
											{new Date(log.createdAt).toLocaleDateString()}
										</Badge>
									</div>
								</div>
							))}
						</div>
					)}

					{/* Summary */}
					<div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
						Showing {filteredLogs.length} of {logs.length} total logs
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default RealTimeAttendance;
