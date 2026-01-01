import { useMemo } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Users, LogIn, Zap, TrendingUp } from "lucide-react";

export default function Dashboard() {
	// Fetch all fingerprints
	const { data: fingerprintsData, isLoading: fingerprintsLoading } = useQuery({
		queryKey: ["fingerprints-count"],
		queryFn: () =>
			FingerprintService.getAllFingerprints({
				limit: 1000,
			}),
		staleTime: 60000,
	});

	// Fetch attendance for today
	const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
		queryKey: ["attendance-today"],
		queryFn: () => {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const tomorrow = new Date(today);
			tomorrow.setDate(tomorrow.getDate() + 1);

			// Format dates as YYYY-MM-DD
			const startDate = today.toISOString().slice(0, 10);
			const endDate = tomorrow.toISOString().slice(0, 10);

			return FingerprintService.getAttendanceHistory({
				startDate,
				endDate,
				limit: 10000,
			});
		},
		staleTime: 30000,
	});

	// Fetch attendance logs to get real-time event information
	const { data: logsData } = useQuery({
		queryKey: ["attendance-logs"],
		queryFn: () =>
			FingerprintService.getAttendanceLogs({
				limit: 100,
			}),
		staleTime: 10000,
	});

	// Calculate today's unique attendees (computed value, not state)
	const todayCount = useMemo(() => {
		if (!attendanceData?.data) return 0;
		const uniqueFingerprintIds = new Set(
			attendanceData.data.map((record) => record.fingerprintId)
		);
		return uniqueFingerprintIds.size;
	}, [attendanceData]);

	const totalFingerprints =
		fingerprintsData?.count || fingerprintsData?.total || 0;
	const registeredToday = todayCount;

	// Get device status and mode from recent logs (check if we have registration or attendance events)
	const recentLogs = logsData?.data || [];
	const hasRecentAttendance = recentLogs.some(
		(log: any) => log.eventType === "attendance"
	);
	const hasRecentRegistration = recentLogs.some(
		(log: any) => log.eventType === "registration"
	);
	const estimatedDeviceMode =
		hasRecentRegistration && !hasRecentAttendance ? "Register" : "Attendance";

	return (
		<div className="min-h-screen p-6">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
						Dashboard
					</h1>
					<p className="text-slate-600 dark:text-slate-400">
						System overview and attendance summary
					</p>
				</div>

				{/* Key Metrics Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
					{/* Total Fingerprints Card */}
					<Card className="border-l-4 border-l-blue-500">
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
									Total Fingerprints
								</CardTitle>
								<Users className="h-4 w-4 text-blue-500" />
							</div>
						</CardHeader>
						<CardContent>
							{fingerprintsLoading ? (
								<Skeleton className="h-10 w-20" />
							) : (
								<>
									<div className="text-3xl font-bold text-slate-900 dark:text-white">
										{totalFingerprints}
									</div>
									<p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
										Registered fingerprints
									</p>
								</>
							)}
						</CardContent>
					</Card>

					{/* Attendance Today Card */}
					<Card className="border-l-4 border-l-green-500">
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
									Attendance Today
								</CardTitle>
								<LogIn className="h-4 w-4 text-green-500" />
							</div>
						</CardHeader>
						<CardContent>
							{attendanceLoading ? (
								<Skeleton className="h-10 w-20" />
							) : (
								<>
									<div className="text-3xl font-bold text-slate-900 dark:text-white">
										{registeredToday}
									</div>
									<p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
										Unique users marked
									</p>
								</>
							)}
						</CardContent>
					</Card>

					{/* Device Mode Card */}
					<Card className="border-l-4 border-l-purple-500">
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
									Device Mode
								</CardTitle>
								<Zap className="h-4 w-4 text-purple-500" />
							</div>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-2">
								<Badge
									variant={
										estimatedDeviceMode === "Register" ? "default" : "secondary"
									}
									className="text-xs"
								>
									{estimatedDeviceMode}
								</Badge>
								<span className="text-xs text-slate-500 dark:text-slate-500">
									(Estimated)
								</span>
							</div>
							<p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
								Based on recent events
							</p>
						</CardContent>
					</Card>

					{/* Attendance Rate Card */}
					<Card className="border-l-4 border-l-orange-500">
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
									Attendance Rate
								</CardTitle>
								<TrendingUp className="h-4 w-4 text-orange-500" />
							</div>
						</CardHeader>
						<CardContent>
							{fingerprintsLoading || attendanceLoading ? (
								<Skeleton className="h-10 w-20" />
							) : (
								<>
									<div className="text-3xl font-bold text-slate-900 dark:text-white">
										{totalFingerprints > 0
											? Math.round((registeredToday / totalFingerprints) * 100)
											: 0}
										%
									</div>
									<p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
										of total registered
									</p>
								</>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Recent Activity Section */}
				<Card>
					<CardHeader>
						<CardTitle>Recent Activity</CardTitle>
						<CardDescription>
							Latest attendance events from the system
						</CardDescription>
					</CardHeader>
					<CardContent>
						{!logsData?.data || logsData.data.length === 0 ? (
							<div className="flex items-center gap-2 text-slate-500">
								<AlertCircle className="h-4 w-4" />
								<p className="text-sm">No recent activity</p>
							</div>
						) : (
							<div className="space-y-3">
								{logsData.data.slice(0, 5).map((log: any, index: number) => (
									<div
										key={index}
										className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg"
									>
										<div>
											<p className="font-medium text-sm text-slate-900 dark:text-white">
												{log.name}
											</p>
											<p className="text-xs text-slate-500 dark:text-slate-400">
												{log.department} •{" "}
												{new Date(log.timestamp).toLocaleTimeString()}
											</p>
										</div>
										<Badge
											variant="outline"
											className="text-xs capitalize"
										>
											{log.eventType}
										</Badge>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
