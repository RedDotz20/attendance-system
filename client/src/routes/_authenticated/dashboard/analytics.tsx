import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFingerprintAttendanceStats } from "@/features/fingerprint/hooks/useFingerprint";
import { BarChart3, TrendingUp, Users, Calendar } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/analytics")({
	component: AnalyticsDashboard,
});

function AnalyticsDashboard() {
	const [dateRange, setDateRange] = useState({
		startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
			.toISOString()
			.split("T")[0], // 30 days ago
		endDate: new Date().toISOString().split("T")[0], // today
	});
	const [selectedDepartment, setSelectedDepartment] = useState<string>("");

	const filters: {
		startDate?: string;
		endDate?: string;
		department?: string;
	} = {};

	if (dateRange.startDate) filters.startDate = dateRange.startDate;
	if (dateRange.endDate) filters.endDate = dateRange.endDate;
	if (selectedDepartment) filters.department = selectedDepartment;

	const {
		data: stats,
		isLoading,
		error,
		refetch,
	} = useFingerprintAttendanceStats(filters);

	const handleDateChange = (field: "startDate" | "endDate", value: string) => {
		setDateRange((prev) => ({ ...prev, [field]: value }));
	};

	const handleRefresh = () => {
		refetch();
	};

	if (error) {
		return (
			<div className="container mx-auto p-6">
				<Alert variant="destructive">
					<AlertDescription>
						Failed to load analytics: {error.message}
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-6 space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Attendance Analytics
					</h1>
					<p className="text-muted-foreground">
						View and analyze attendance statistics
					</p>
				</div>
				<Button
					onClick={handleRefresh}
					variant="outline"
				>
					<TrendingUp className="mr-2 h-4 w-4" />
					Refresh Data
				</Button>
			</div>

			{/* Filters */}
			<Card>
				<CardHeader>
					<CardTitle>Filters</CardTitle>
					<CardDescription>Customize your analytics view</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="space-y-2">
							<Label htmlFor="startDate">Start Date</Label>
							<Input
								id="startDate"
								type="date"
								value={dateRange.startDate}
								onChange={(e) => handleDateChange("startDate", e.target.value)}
								max={dateRange.endDate}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="endDate">End Date</Label>
							<Input
								id="endDate"
								type="date"
								value={dateRange.endDate}
								onChange={(e) => handleDateChange("endDate", e.target.value)}
								min={dateRange.startDate}
								max={new Date().toISOString().split("T")[0]}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="department">Department</Label>
							<Select
								value={selectedDepartment}
								onValueChange={setSelectedDepartment}
							>
								<SelectTrigger id="department">
									<SelectValue placeholder="All Departments" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">All Departments</SelectItem>
									{stats?.byDepartment?.map((dept) => (
										<SelectItem
											key={dept.department}
											value={dept.department}
										>
											{dept.department}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Summary Cards */}
			{isLoading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{[...Array(4)].map((_, i) => (
						<Card key={i}>
							<CardHeader>
								<Skeleton className="h-4 w-24" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-8 w-16" />
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Total Attendance
							</CardTitle>
							<BarChart3 className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{stats?.summary?.totalAttendance || 0}
							</div>
							<p className="text-xs text-muted-foreground">
								Total scans in selected period
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Unique Users
							</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{stats?.summary?.uniqueUsers || 0}
							</div>
							<p className="text-xs text-muted-foreground">
								Different employees attended
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Departments</CardTitle>
							<Calendar className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{stats?.byDepartment?.length || 0}
							</div>
							<p className="text-xs text-muted-foreground">
								Active departments
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Avg Daily Attendance
							</CardTitle>
							<TrendingUp className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{stats?.dailyTrend?.length
									? Math.round(
											stats.summary.totalAttendance / stats.dailyTrend.length
									  )
									: 0}
							</div>
							<p className="text-xs text-muted-foreground">Average per day</p>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Department Breakdown */}
			<Card>
				<CardHeader>
					<CardTitle>Attendance by Department</CardTitle>
					<CardDescription>
						Breakdown of attendance records by department
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-2">
							{[...Array(5)].map((_, i) => (
								<Skeleton
									key={i}
									className="h-12 w-full"
								/>
							))}
						</div>
					) : stats?.byDepartment && stats.byDepartment.length > 0 ? (
						<div className="space-y-4">
							{stats.byDepartment.map((dept) => (
								<div
									key={dept.department}
									className="flex items-center justify-between p-4 border rounded-lg"
								>
									<div className="flex-1">
										<div className="flex items-center gap-2">
											<h3 className="font-semibold">{dept.department}</h3>
											<Badge variant="outline">{dept.count} scans</Badge>
										</div>
										<p className="text-sm text-muted-foreground mt-1">
											{dept.uniqueUsers} unique users
										</p>
									</div>
									<div className="text-right">
										<div className="text-2xl font-bold">{dept.count}</div>
										<div className="text-xs text-muted-foreground">
											{stats.summary.totalAttendance > 0
												? Math.round(
														(dept.count / stats.summary.totalAttendance) * 100
												  )
												: 0}
											% of total
										</div>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-8 text-muted-foreground">
							No department data available for selected period
						</div>
					)}
				</CardContent>
			</Card>

			{/* Daily Trend */}
			<Card>
				<CardHeader>
					<CardTitle>Daily Attendance Trend</CardTitle>
					<CardDescription>
						Attendance activity over the selected period
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<Skeleton className="h-64 w-full" />
					) : stats?.dailyTrend && stats.dailyTrend.length > 0 ? (
						<div className="space-y-2">
							{stats.dailyTrend.slice(-14).map((day) => (
								<div
									key={day.date}
									className="flex items-center justify-between p-3 border rounded"
								>
									<div>
										<div className="font-medium">
											{new Date(day.date).toLocaleDateString("en-US", {
												weekday: "short",
												month: "short",
												day: "numeric",
											})}
										</div>
										<div className="text-xs text-muted-foreground">
											{day.uniqueUsers} users
										</div>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-48 bg-secondary rounded-full h-2">
											<div
												className="bg-primary h-2 rounded-full"
												style={{
													width: `${
														stats.summary.totalAttendance > 0
															? (day.count / stats.summary.totalAttendance) *
															  100
															: 0
													}%`,
												}}
											/>
										</div>
										<Badge variant="outline">{day.count}</Badge>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-8 text-muted-foreground">
							No daily trend data available for selected period
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
