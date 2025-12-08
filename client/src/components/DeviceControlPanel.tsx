import { useEffect, useRef, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	useSetDeviceMode,
	useSendRegistrationData,
} from "@/features/fingerprint/hooks/useFingerprint";
import { Fingerprint, UserPlus, CheckCircle2, Radio, Send } from "lucide-react";
import mqtt from "mqtt";

interface DeviceControlPanelProps {
	deviceId?: string;
}

export function DeviceControlPanel({
	deviceId: initialDeviceId,
}: DeviceControlPanelProps) {
	const [deviceId, setDeviceId] = useState(initialDeviceId || "");
	const [currentMode, setCurrentMode] = useState<"attendance" | "register">(
		"attendance"
	);
	const [registrationData, setRegistrationData] = useState({
		name: "",
		department: "",
	});
	const [lastSeenDeviceId, setLastSeenDeviceId] = useState<string | null>(null);
	const [mqttStatus, setMqttStatus] = useState<
		"idle" | "connecting" | "connected" | "error"
	>("idle");
	const mqttClientRef = useRef<mqtt.MqttClient | null>(null);
	const deviceIdRef = useRef(deviceId);

	const LAST_DEVICE_ID_KEY = "deviceControl.lastDeviceId";

	const setModeMutation = useSetDeviceMode();
	const sendDataMutation = useSendRegistrationData();

	const persistDeviceId = (value: string) => {
		deviceIdRef.current = value;
		setDeviceId(value);
		if (typeof window !== "undefined") {
			window.localStorage.setItem(LAST_DEVICE_ID_KEY, value);
		}
	};

	useEffect(() => {
		if (initialDeviceId) return;
		if (typeof window === "undefined") return;
		const saved = window.localStorage.getItem(LAST_DEVICE_ID_KEY);
		if (saved) {
			deviceIdRef.current = saved;
			setDeviceId(saved);
			setLastSeenDeviceId(saved);
		}
	}, [initialDeviceId]);

	useEffect(() => {
		if (!initialDeviceId) return;
		persistDeviceId(initialDeviceId);
	}, [initialDeviceId]);

	useEffect(() => {
		const MQTT_BROKER_WS_URL =
			import.meta.env["VITE_MQTT_WS_URL"] || "ws://localhost:9001";
		const MQTT_USERNAME = import.meta.env["VITE_MQTT_USERNAME"] || "";
		const MQTT_PASSWORD = import.meta.env["VITE_MQTT_PASSWORD"] || "";

		setMqttStatus("connecting");

		try {
			const options: mqtt.IClientOptions = {
				clientId: `device-control-${Date.now()}`,
				clean: true,
				connectTimeout: 10000,
				protocol: MQTT_BROKER_WS_URL.startsWith("wss://") ? "wss" : "ws",
				reconnectPeriod: 5000,
			};

			if (MQTT_USERNAME && MQTT_PASSWORD) {
				options.username = MQTT_USERNAME;
				options.password = MQTT_PASSWORD;
			}

			const client = mqtt.connect(MQTT_BROKER_WS_URL, options);
			mqttClientRef.current = client;

			client.on("connect", () => {
				setMqttStatus("connected");
				client.subscribe("attendance/device/status");
			});

			client.on("error", () => {
				setMqttStatus("error");
			});

			client.on("close", () => {
				setMqttStatus("error");
			});

			client.on("message", (_topic, payload) => {
				try {
					const message = JSON.parse(payload.toString());
					const detectedId = message?.device_id as string | undefined;
					const isOnline = message?.status === "online";

					if (detectedId && isOnline) {
						setLastSeenDeviceId(detectedId);

						if (!deviceIdRef.current) {
							persistDeviceId(detectedId);
						}
					}
				} catch (error) {
					console.error("Failed to parse device status", error);
				}
			});
		} catch (error) {
			setMqttStatus("error");
		}

		return () => {
			if (mqttClientRef.current) {
				mqttClientRef.current.end(true);
				mqttClientRef.current = null;
			}
		};
		// We only want to connect once on mount
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleModeChange = (mode: "attendance" | "register") => {
		const normalizedDeviceId = deviceId.trim();

		if (!normalizedDeviceId) {
			alert("Please enter a device ID");
			return;
		}

		persistDeviceId(normalizedDeviceId);

		setModeMutation.mutate(
			{ deviceId: normalizedDeviceId, mode },
			{
				onSuccess: () => {
					setCurrentMode(mode);
					if (mode === "attendance") {
						// Clear registration data when switching to attendance mode
						setRegistrationData({ name: "", department: "" });
					}
				},
			}
		);
	};

	const handleSendRegistrationData = () => {
		const normalizedDeviceId = deviceId.trim();

		if (!normalizedDeviceId) {
			alert("Please enter a device ID");
			return;
		}

		persistDeviceId(normalizedDeviceId);

		if (!registrationData.name || !registrationData.department) {
			alert("Please enter both name and department");
			return;
		}

		sendDataMutation.mutate({
			deviceId: normalizedDeviceId,
			name: registrationData.name,
			department: registrationData.department,
		});
	};

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Radio className="h-5 w-5" />
					Device Control Panel
				</CardTitle>
				<CardDescription>
					Control your ESP32 fingerprint scanner remotely
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Device ID Input */}
				<div className="space-y-2">
					<Label htmlFor="deviceId">Device ID</Label>
					<Input
						id="deviceId"
						placeholder="esp32_att_1a2b3c4d"
						value={deviceId}
						onChange={(e) => persistDeviceId(e.target.value)}
					/>
					<p className="text-xs text-muted-foreground">
						Enter your ESP32 device ID or wait for auto-detect when the device
						comes online
					</p>
					{lastSeenDeviceId && (
						<div className="flex items-center justify-between text-xs text-muted-foreground">
							<span>Detected device: {lastSeenDeviceId}</span>
							{deviceId !== lastSeenDeviceId && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => persistDeviceId(lastSeenDeviceId)}
								>
									Use detected
								</Button>
							)}
						</div>
					)}
				</div>

				{/* Current Mode Display */}
				<div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
					<div>
						<p className="text-sm font-medium">Current Mode</p>
						<p className="text-xs text-muted-foreground">
							Device operating mode
						</p>
					</div>
					<Badge
						variant={currentMode === "register" ? "default" : "secondary"}
						className="text-sm"
					>
						{currentMode === "register" ? (
							<>
								<UserPlus className="h-3 w-3 mr-1" />
								Register Mode
							</>
						) : (
							<>
								<CheckCircle2 className="h-3 w-3 mr-1" />
								Attendance Mode
							</>
						)}
					</Badge>
				</div>

				{/* Mode Control Buttons */}
				<div className="space-y-2">
					<Label>Switch Device Mode</Label>
					<div className="grid grid-cols-2 gap-3">
						<Button
							variant={currentMode === "attendance" ? "default" : "outline"}
							onClick={() => handleModeChange("attendance")}
							disabled={
								setModeMutation.isPending || currentMode === "attendance"
							}
							className="w-full"
						>
							<CheckCircle2 className="h-4 w-4 mr-2" />
							Attendance Mode
						</Button>
						<Button
							variant={currentMode === "register" ? "default" : "outline"}
							onClick={() => handleModeChange("register")}
							disabled={setModeMutation.isPending || currentMode === "register"}
							className="w-full"
						>
							<UserPlus className="h-4 w-4 mr-2" />
							Register Mode
						</Button>
					</div>
				</div>

				{/* Registration Data Section - Only show in register mode */}
				{currentMode === "register" && (
					<Card className="border-2 border-primary/20">
						<CardHeader className="pb-3">
							<CardTitle className="text-base flex items-center gap-2">
								<Fingerprint className="h-4 w-4" />
								Registration Setup
							</CardTitle>
							<CardDescription className="text-xs">
								Enter user details, then scan fingerprint on the device
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="name">Full Name</Label>
								<Input
									id="name"
									placeholder="John Doe"
									value={registrationData.name}
									onChange={(e) =>
										setRegistrationData((prev) => ({
											...prev,
											name: e.target.value,
										}))
									}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="department">Department</Label>
								<Select
									value={registrationData.department}
									onValueChange={(value) =>
										setRegistrationData((prev) => ({
											...prev,
											department: value,
										}))
									}
								>
									<SelectTrigger id="department">
										<SelectValue placeholder="Select department" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Engineering">Engineering</SelectItem>
										<SelectItem value="HR">Human Resources</SelectItem>
										<SelectItem value="Finance">Finance</SelectItem>
										<SelectItem value="Marketing">Marketing</SelectItem>
										<SelectItem value="Sales">Sales</SelectItem>
										<SelectItem value="Operations">Operations</SelectItem>
										<SelectItem value="IT">IT</SelectItem>
										<SelectItem value="Admin">Administration</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<Button
								onClick={handleSendRegistrationData}
								disabled={
									sendDataMutation.isPending ||
									!registrationData.name ||
									!registrationData.department
								}
								className="w-full"
							>
								<Send className="h-4 w-4 mr-2" />
								{sendDataMutation.isPending
									? "Sending..."
									: "Send to Device & Scan Fingerprint"}
							</Button>

							<div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
								<p className="text-xs text-blue-900 dark:text-blue-100">
									<strong>Next steps:</strong>
								</p>
								<ol className="text-xs text-blue-800 dark:text-blue-200 mt-1 ml-4 list-decimal space-y-1">
									<li>Click "Send to Device"</li>
									<li>Place finger on the scanner</li>
									<li>Remove and place again for verification</li>
									<li>Registration complete!</li>
								</ol>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Status Indicator */}
				<div className="flex items-center justify-between text-xs text-muted-foreground">
					<span>
						{setModeMutation.isPending || sendDataMutation.isPending
							? "Processing..."
							: "Ready"}
					</span>
					<Badge
						variant={mqttStatus === "connected" ? "outline" : "destructive"}
						className="text-xs"
					>
						{mqttStatus === "connected"
							? "MQTT Connected"
							: "MQTT Disconnected"}
					</Badge>
				</div>
			</CardContent>
		</Card>
	);
}
