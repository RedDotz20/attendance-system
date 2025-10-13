import { createFileRoute } from "@tanstack/react-router";
import RealTimeAttendance from "@/components/RealTimeAttendance";

export const Route = createFileRoute("/_authenticated/dashboard/realtime")({
	component: () => (
		<div className="container mx-auto py-6">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">Real-time Attendance</h1>
				<p className="text-muted-foreground">
					Monitor live attendance events from connected IoT devices
				</p>
			</div>
			<RealTimeAttendance />
		</div>
	),
});
