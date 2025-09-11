import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, Filter, Download, MoreHorizontal } from "lucide-react";
import {
	useFingerprints,
	useFingerprintAttendanceHistory,
	useRegisterFingerprint,
} from "@/features/fingerprint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingPage from "@/components/LoadingPage";
import { FingerprintRegistrationForm } from "./components/FingerprintRegistrationForm";

export const Route = createFileRoute("/_authenticated/fingerprints/")({
	component: FingerprintsPage,
});

function FingerprintsPage() {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedDepartment] = useState("");
	const [currentPage] = useState(1);
	const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);

	// Fetch fingerprints
	const fingerprintFilters: any = {
		page: currentPage,
		limit: 10,
	};

	if (searchTerm) {
		fingerprintFilters.search = searchTerm;
	}

	if (selectedDepartment) {
		fingerprintFilters.department = selectedDepartment;
	}

	const {
		data: fingerprintsData,
		isLoading: fingerprintsLoading,
		error: fingerprintsError,
	} = useFingerprints(fingerprintFilters);

	// Fetch attendance history
	const { data: attendanceData, isLoading: attendanceLoading } =
		useFingerprintAttendanceHistory({
			page: 1,
			limit: 10,
		});

	const registerMutation = useRegisterFingerprint();

	if (fingerprintsLoading) {
		return <LoadingPage />;
	}

	if (fingerprintsError) {
		return (
			<div className="flex items-center justify-center h-64">
				<p className="text-red-500">Error loading fingerprints</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Fingerprint Management</h1>
					<p className="text-muted-foreground">
						Manage fingerprint registrations and attendance
					</p>
				</div>

				<Dialog
					open={isRegisterDialogOpen}
					onOpenChange={setIsRegisterDialogOpen}
				>
					<DialogTrigger asChild>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Register Fingerprint
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Register New Fingerprint</DialogTitle>
						</DialogHeader>
						<FingerprintRegistrationForm
							onSuccess={() => setIsRegisterDialogOpen(false)}
							isLoading={registerMutation.isPending}
						/>
					</DialogContent>
				</Dialog>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Fingerprints
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{fingerprintsData?.pagination?.totalItems || 0}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Today's Attendance
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{attendanceData?.data?.filter(
								(record) =>
									new Date(record.timestamp).toDateString() ===
									new Date().toDateString()
							).length || 0}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Active Departments
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{new Set(fingerprintsData?.data?.map((f) => f.department)).size ||
								0}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Content */}
			<Tabs
				defaultValue="fingerprints"
				className="space-y-4"
			>
				<TabsList>
					<TabsTrigger value="fingerprints">
						Registered Fingerprints
					</TabsTrigger>
					<TabsTrigger value="attendance">Attendance History</TabsTrigger>
				</TabsList>

				<TabsContent
					value="fingerprints"
					className="space-y-4"
				>
					{/* Search and Filters */}
					<div className="flex items-center space-x-2">
						<div className="relative flex-1">
							<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search fingerprints..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-8"
							/>
						</div>
						<Button
							variant="outline"
							size="icon"
						>
							<Filter className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							size="icon"
						>
							<Download className="h-4 w-4" />
						</Button>
					</div>

					{/* Fingerprints Table */}
					<Card>
						<CardHeader>
							<CardTitle>Registered Fingerprints</CardTitle>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>ID</TableHead>
										<TableHead>Name</TableHead>
										<TableHead>Department</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Registered</TableHead>
										<TableHead className="w-[100px]">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{fingerprintsData?.data?.map((fingerprint) => (
										<TableRow key={fingerprint.fingerprintId}>
											<TableCell className="font-medium">
												{fingerprint.fingerprintId}
											</TableCell>
											<TableCell>{fingerprint.name}</TableCell>
											<TableCell>{fingerprint.department}</TableCell>
											<TableCell>
												<Badge
													variant={
														fingerprint.isActive ? "default" : "secondary"
													}
												>
													{fingerprint.isActive ? "Active" : "Inactive"}
												</Badge>
											</TableCell>
											<TableCell>
												{new Date(fingerprint.createdAt).toLocaleDateString()}
											</TableCell>
											<TableCell>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															className="h-8 w-8 p-0"
														>
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem>View Details</DropdownMenuItem>
														<DropdownMenuItem>Edit</DropdownMenuItem>
														<DropdownMenuItem className="text-red-600">
															Deactivate
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent
					value="attendance"
					className="space-y-4"
				>
					<Card>
						<CardHeader>
							<CardTitle>Recent Attendance</CardTitle>
						</CardHeader>
						<CardContent>
							{attendanceLoading ? (
								<div className="text-center py-4">Loading attendance...</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Fingerprint ID</TableHead>
											<TableHead>Name</TableHead>
											<TableHead>Department</TableHead>
											<TableHead>Time</TableHead>
											<TableHead>Date</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{attendanceData?.data?.map((record, index) => (
											<TableRow key={index}>
												<TableCell className="font-medium">
													{record.fingerprintId}
												</TableCell>
												<TableCell>{record.name}</TableCell>
												<TableCell>{record.department}</TableCell>
												<TableCell>
													{new Date(record.timestamp).toLocaleTimeString()}
												</TableCell>
												<TableCell>
													{new Date(record.timestamp).toLocaleDateString()}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
