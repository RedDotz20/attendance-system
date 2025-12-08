import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FingerprintService, DeviceControlService } from "../services/fingerprint.service";
import type {
	FingerprintRegistration,
	FingerprintAttendanceRequest,
	FingerprintListFilters,
	FingerprintAttendanceFilters,
} from "@/types/fingerprint.type";
import { toast } from "sonner";

/**
 * Query keys for fingerprint-related queries
 */
export const fingerprintQueryKeys = {
	all: ["fingerprints"] as const,
	lists: () => [...fingerprintQueryKeys.all, "list"] as const,
	list: (filters: FingerprintListFilters) =>
		[...fingerprintQueryKeys.lists(), filters] as const,
	details: () => [...fingerprintQueryKeys.all, "detail"] as const,
	detail: (id: string) => [...fingerprintQueryKeys.details(), id] as const,
	attendance: () => [...fingerprintQueryKeys.all, "attendance"] as const,
	attendanceHistory: (filters: FingerprintAttendanceFilters) =>
		[...fingerprintQueryKeys.attendance(), filters] as const,
	attendanceStats: (filters: any) =>
		[...fingerprintQueryKeys.attendance(), "stats", filters] as const,
	userReport: (id: string, filters: any) =>
		[...fingerprintQueryKeys.attendance(), "user", id, filters] as const,
	check: (id: string) => [...fingerprintQueryKeys.all, "check", id] as const,
};

/**
 * Hook to get all fingerprints with pagination and filtering
 */
export function useFingerprints(filters: FingerprintListFilters = {}) {
	return useQuery({
		queryKey: fingerprintQueryKeys.list(filters),
		queryFn: () => FingerprintService.getAllFingerprints(filters),
		staleTime: 5 * 60 * 1000, // 5 minutes
		retry: 3,
	});
}

/**
 * Hook to check if a fingerprint is registered
 */
export function useCheckFingerprint(fingerprintId: string, enabled = true) {
	return useQuery({
		queryKey: fingerprintQueryKeys.check(fingerprintId),
		queryFn: () => FingerprintService.checkFingerprint(fingerprintId),
		enabled: enabled && !!fingerprintId,
		staleTime: 1 * 60 * 1000, // 1 minute
		retry: 2,
	});
}

/**
 * Hook to get fingerprint attendance history
 */
export function useFingerprintAttendanceHistory(
	filters: FingerprintAttendanceFilters = {}
) {
	return useQuery({
		queryKey: fingerprintQueryKeys.attendanceHistory(filters),
		queryFn: () => FingerprintService.getAttendanceHistory(filters),
		staleTime: 2 * 60 * 1000, // 2 minutes
		retry: 3,
	});
}

/**
 * Hook to register a new fingerprint
 */
export function useRegisterFingerprint() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: FingerprintRegistration) =>
			FingerprintService.registerFingerprint(data),
		onSuccess: (data) => {
			// Invalidate and refetch fingerprint lists
			queryClient.invalidateQueries({
				queryKey: fingerprintQueryKeys.lists(),
			});

			// Update the check query for this fingerprint
			queryClient.setQueryData(fingerprintQueryKeys.check(data.fingerprintId), {
				...data,
				registered: true,
			});

			toast.success(`Fingerprint registered successfully for ${data.name}`, {
				description: `Fingerprint ID: ${data.fingerprintId}`,
			});
		},
		onError: (error: Error) => {
			toast.error("Failed to register fingerprint", {
				description: error.message,
			});
		},
	});
}

/**
 * Hook to mark fingerprint attendance
 */
export function useMarkFingerprintAttendance() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: FingerprintAttendanceRequest) =>
			FingerprintService.markAttendance(data),
		onSuccess: (data) => {
			// Invalidate attendance history queries
			queryClient.invalidateQueries({
				queryKey: fingerprintQueryKeys.attendance(),
			});

			toast.success(`Attendance marked for ${data.name}`, {
				description: `Department: ${data.department} | Time: ${new Date(
					data.timestamp
				).toLocaleTimeString()}`,
			});
		},
		onError: (error: Error) => {
			toast.error("Failed to mark attendance", {
				description: error.message,
			});
		},
	});
}

/**
 * Hook to get attendance statistics
 */
export function useFingerprintAttendanceStats(filters: {
	startDate?: string;
	endDate?: string;
	department?: string;
} = {}) {
	return useQuery({
		queryKey: fingerprintQueryKeys.attendanceStats(filters),
		queryFn: () => FingerprintService.getAttendanceStats(filters),
		staleTime: 5 * 60 * 1000, // 5 minutes
		retry: 2,
	});
}

/**
 * Hook to get user attendance report
 */
export function useUserAttendanceReport(
	fingerprintId: string,
	filters: {
		startDate?: string;
		endDate?: string;
	} = {},
	enabled = true
) {
	return useQuery({
		queryKey: fingerprintQueryKeys.userReport(fingerprintId, filters),
		queryFn: () => FingerprintService.getUserAttendanceReport(fingerprintId, filters),
		enabled: enabled && !!fingerprintId,
		staleTime: 3 * 60 * 1000, // 3 minutes
		retry: 2,
	});
}

/**
 * Hook to prefetch fingerprint data
 */
export function usePrefetchFingerprint() {
	const queryClient = useQueryClient();

	const prefetchFingerprints = (filters: FingerprintListFilters = {}) => {
		queryClient.prefetchQuery({
			queryKey: fingerprintQueryKeys.list(filters),
			queryFn: () => FingerprintService.getAllFingerprints(filters),
			staleTime: 5 * 60 * 1000,
		});
	};

	const prefetchAttendanceHistory = (
		filters: FingerprintAttendanceFilters = {}
	) => {
		queryClient.prefetchQuery({
			queryKey: fingerprintQueryKeys.attendanceHistory(filters),
			queryFn: () => FingerprintService.getAttendanceHistory(filters),
			staleTime: 2 * 60 * 1000,
		});
	};

	return {
		prefetchFingerprints,
		prefetchAttendanceHistory,
	};
}

// ============================================
// Device Control Hooks
// ============================================

/**
 * Hook to set device mode
 */
export function useSetDeviceMode() {
	return useMutation({
		mutationFn: ({ deviceId, mode }: { deviceId: string; mode: "register" | "attendance" }) =>
			DeviceControlService.setDeviceMode(deviceId, mode),
		onSuccess: (_data, variables) => {
			toast.success(`Device mode changed to ${variables.mode}`, {
				description: "Device will update momentarily",
			});
		},
		onError: (error: Error) => {
			toast.error("Failed to change device mode", {
				description: error.message,
			});
		},
	});
}

/**
 * Hook to send registration data to device
 */
export function useSendRegistrationData() {
	return useMutation({
		mutationFn: ({
			deviceId,
			name,
			department,
		}: {
			deviceId: string;
			name: string;
			department: string;
		}) => DeviceControlService.sendRegistrationData(deviceId, name, department),
		onSuccess: () => {
			toast.success("Registration data sent to device", {
				description: "Device is ready for fingerprint scan",
			});
		},
		onError: (error: Error) => {
			toast.error("Failed to send registration data", {
				description: error.message,
			});
		},
	});
}

/**
 * Hook to broadcast command to all devices
 */
export function useBroadcastToDevices() {
	return useMutation({
		mutationFn: ({ command, mode }: { command: string; mode?: "register" | "attendance" }) =>
			DeviceControlService.broadcastToAllDevices(command, mode),
		onSuccess: () => {
			toast.success("Command broadcast to all devices");
		},
		onError: (error: Error) => {
			toast.error("Failed to broadcast command", {
				description: error.message,
			});
		},
	});
}
