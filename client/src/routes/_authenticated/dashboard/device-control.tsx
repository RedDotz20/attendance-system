import { createFileRoute } from "@tanstack/react-router";
import { DeviceControlPanel } from "@/components/DeviceControlPanel";

export const Route = createFileRoute(
	"/_authenticated/dashboard/device-control"
)({
	component: DeviceControlPage,
});

function DeviceControlPage() {
	return (
		<div className="container mx-auto p-6 space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Device Control</h1>
				<p className="text-muted-foreground">
					Remotely control your ESP32 fingerprint scanner devices
				</p>
			</div>

			{/* Device Control Panel */}
			<div className="max-w-2xl">
				<DeviceControlPanel />
			</div>

			{/* Help Section */}
			<div className="max-w-2xl mt-8">
				<div className="border rounded-lg p-6 space-y-4">
					<h2 className="text-xl font-semibold">How it Works</h2>

					<div className="space-y-3">
						<div>
							<h3 className="font-medium text-sm mb-1">
								🎯 Attendance Mode (Default)
							</h3>
							<p className="text-sm text-muted-foreground">
								Users scan their registered fingerprints to mark attendance. The
								system logs the timestamp and updates in real-time.
							</p>
						</div>

						<div>
							<h3 className="font-medium text-sm mb-1">📝 Register Mode</h3>
							<p className="text-sm text-muted-foreground">
								Switch to this mode to enroll new fingerprints. Enter the user's
								name and department from the web UI, then scan their fingerprint
								on the device.
							</p>
						</div>

						<div>
							<h3 className="font-medium text-sm mb-1">
								🔄 How to Register a New User
							</h3>
							<ol className="text-sm text-muted-foreground list-decimal ml-5 space-y-1">
								<li>Enter your device ID in the field above</li>
								<li>Click "Register Mode" to switch the device</li>
								<li>Fill in the user's name and department</li>
								<li>Click "Send to Device & Scan Fingerprint"</li>
								<li>Have the user place their finger on the scanner</li>
								<li>Follow the LCD prompts on the device</li>
								<li>Registration complete!</li>
							</ol>
						</div>

						<div>
							<h3 className="font-medium text-sm mb-1">💡 Tips</h3>
							<ul className="text-sm text-muted-foreground list-disc ml-5 space-y-1">
								<li>Find your device ID in the serial monitor or MQTT logs</li>
								<li>The device will show confirmation on its LCD screen</li>
								<li>Switch back to "Attendance Mode" after registration</li>
								<li>All mode changes happen in real-time via MQTT</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
