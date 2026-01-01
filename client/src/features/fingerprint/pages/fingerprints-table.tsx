import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FingerprintService } from "@/features/fingerprint/services/fingerprint.service";
import type { Fingerprint } from "@/types/fingerprint.type";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
	AlertCircle,
	ChevronUp,
	ChevronDown,
	ChevronsUpDown,
} from "lucide-react";

type SortField = "name" | "department" | "createdAt" | "updatedAt";
type SortOrder = "asc" | "desc";

export default function FingerprintsPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedDepartment, setSelectedDepartment] = useState("all");
	const [sortField, setSortField] = useState<SortField>("createdAt");
	const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

	// Fetch all fingerprints
	const { data: fingerprintsData, isLoading: fingerprintsLoading } = useQuery({
		queryKey: ["all-fingerprints"],
		queryFn: () =>
			FingerprintService.getAllFingerprints({
				limit: 10000,
			}),
		staleTime: 60000,
	});

	// Fetch last attendance for each fingerprint
	const { data: attendanceData } = useQuery({
		queryKey: ["last-attendance"],
		queryFn: () =>
			FingerprintService.getAttendanceHistory({
				limit: 5000,
			}),
		staleTime: 30000,
	});

	const allFingerprints: Fingerprint[] = fingerprintsData?.data || [];

	// Create a map of last attendance timestamp for each fingerprint
	const lastAttendanceMap = useMemo(() => {
		const map = new Map<string, string>();
		if (attendanceData?.data) {
			attendanceData.data.forEach((record: any) => {
				if (!map.has(record.fingerprintId)) {
					map.set(record.fingerprintId, record.timestamp);
				}
			});
		}
		return map;
	}, [attendanceData]);

	// Get unique departments
	const departments = useMemo(() => {
		return Array.from(new Set(allFingerprints.map((fp) => fp.department)));
	}, [allFingerprints]);

	// Filter fingerprints
	const filteredFingerprints = useMemo(() => {
		let filtered = allFingerprints;

		// Department filter
		if (selectedDepartment !== "all") {
			filtered = filtered.filter((fp) => fp.department === selectedDepartment);
		}

		// Search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(fp) =>
					fp.name.toLowerCase().includes(query) ||
					fp.fingerprintId.toLowerCase().includes(query)
			);
		}

		return filtered;
	}, [allFingerprints, selectedDepartment, searchQuery]);

	// Sort fingerprints
	const sortedFingerprints = useMemo(() => {
		const sorted = [...filteredFingerprints];

		sorted.sort((a, b) => {
			let aVal: any, bVal: any;

			switch (sortField) {
				case "name":
					aVal = a.name.toLowerCase();
					bVal = b.name.toLowerCase();
					break;
				case "department":
					aVal = a.department.toLowerCase();
					bVal = b.department.toLowerCase();
					break;
				case "createdAt":
					aVal = new Date(a.createdAt).getTime();
					bVal = new Date(b.createdAt).getTime();
					break;
				case "updatedAt":
					aVal = lastAttendanceMap.get(a.fingerprintId) || a.updatedAt;
					bVal = lastAttendanceMap.get(b.fingerprintId) || b.updatedAt;
					aVal = new Date(aVal).getTime();
					bVal = new Date(bVal).getTime();
					break;
				default:
					return 0;
			}

			if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
			if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
			return 0;
		});

		return sorted;
	}, [filteredFingerprints, sortField, sortOrder, lastAttendanceMap]);

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortOrder(sortOrder === "asc" ? "desc" : "asc");
		} else {
			setSortField(field);
			setSortOrder("asc");
		}
	};

	const SortIcon = ({ field }: { field: SortField }) => {
		if (sortField !== field) {
			return <ChevronsUpDown className="h-4 w-4" />;
		}
		return sortOrder === "asc" ? (
			<ChevronUp className="h-4 w-4" />
		) : (
			<ChevronDown className="h-4 w-4" />
		);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	const formatDateTime = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<div className="min-h-screen p-6">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
						Registered Fingerprints
					</h1>
					<p className="text-slate-600 dark:text-slate-400">
						Manage and view all registered fingerprints with attendance history
					</p>
				</div>

				{/* Summary Stats */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium">
								Total Fingerprints
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{allFingerprints.length}</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium">Departments</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{departments.length}</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium">Active</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{allFingerprints.filter((fp) => fp.isActive).length}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium">
								Filtered Results
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{sortedFingerprints.length}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Main Content Card */}
				<Card>
					<CardHeader>
						<CardTitle>Fingerprints Database</CardTitle>
						<CardDescription>
							View detailed information about all registered fingerprints
						</CardDescription>
					</CardHeader>
					<CardContent>
						{/* Filters */}
						<div className="flex gap-4 mb-6 flex-col md:flex-row">
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
								<SelectTrigger className="w-full md:w-48">
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

						{/* Table */}
						{fingerprintsLoading ? (
							<div className="space-y-3">
								{[...Array(5)].map((_, i) => (
									<Skeleton
										key={i}
										className="h-16"
									/>
								))}
							</div>
						) : sortedFingerprints.length === 0 ? (
							<div className="text-center py-12">
								<AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
								<p className="text-muted-foreground">
									{allFingerprints.length === 0
										? "No fingerprints registered yet"
										: "No fingerprints match your filters"}
								</p>
							</div>
						) : (
							<div className="rounded-lg border overflow-x-auto">
								<Table>
									<TableHeader className="bg-slate-50 dark:bg-slate-900/50">
										<TableRow>
											<TableHead className="w-[120px]">
												<Button
													variant="ghost"
													size="sm"
													className="h-8 gap-2"
													onClick={() => handleSort("name")}
												>
													Name
													<SortIcon field="name" />
												</Button>
											</TableHead>
											<TableHead className="w-[150px]">ID</TableHead>
											<TableHead>
												<Button
													variant="ghost"
													size="sm"
													className="h-8 gap-2"
													onClick={() => handleSort("department")}
												>
													Department
													<SortIcon field="department" />
												</Button>
											</TableHead>
											<TableHead>
												<Button
													variant="ghost"
													size="sm"
													className="h-8 gap-2"
													onClick={() => handleSort("updatedAt")}
												>
													Last Attendance
													<SortIcon field="updatedAt" />
												</Button>
											</TableHead>
											<TableHead>
												<Button
													variant="ghost"
													size="sm"
													className="h-8 gap-2"
													onClick={() => handleSort("createdAt")}
												>
													Created
													<SortIcon field="createdAt" />
												</Button>
											</TableHead>
											<TableHead className="w-[100px]">Status</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{sortedFingerprints.map((fingerprint) => (
											<TableRow
												key={fingerprint.fingerprintId}
												className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition"
											>
												<TableCell className="font-medium truncate">
													{fingerprint.name}
												</TableCell>
												<TableCell className="text-sm font-mono text-muted-foreground truncate">
													{fingerprint.fingerprintId}
												</TableCell>
												<TableCell>
													<Badge variant="secondary">
														{fingerprint.department}
													</Badge>
												</TableCell>
												<TableCell className="text-sm">
													{lastAttendanceMap.has(fingerprint.fingerprintId) ? (
														<span className="text-green-600 dark:text-green-400">
															{formatDateTime(
																lastAttendanceMap.get(
																	fingerprint.fingerprintId
																)!
															)}
														</span>
													) : (
														<span className="text-muted-foreground italic">
															Never marked
														</span>
													)}
												</TableCell>
												<TableCell className="text-sm text-muted-foreground">
													{formatDate(fingerprint.createdAt)}
												</TableCell>
												<TableCell>
													<Badge
														variant={
															fingerprint.isActive ? "default" : "secondary"
														}
														className="text-xs"
													>
														{fingerprint.isActive ? "Active" : "Inactive"}
													</Badge>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}

						{/* Summary */}
						<div className="mt-6 pt-6 border-t text-sm text-muted-foreground">
							Showing {sortedFingerprints.length} of {allFingerprints.length}{" "}
							total fingerprints
							{selectedDepartment !== "all" &&
								` • Department: ${selectedDepartment}`}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
