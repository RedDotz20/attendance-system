import { ApiFingerprintClient } from "@/lib/api-fingerprint-client";
import type {
	Fingerprint,
	FingerprintRegistration,
	FingerprintAttendance,
	FingerprintAttendanceRequest,
	FingerprintCheckResponse,
	FingerprintListFilters,
	FingerprintAttendanceFilters,
} from "@/types/fingerprint.type";
import type { PaginatedResponse } from "@/types/api";

/**
 * Fingerprint API service for managing fingerprint operations
 * Uses ApiFingerprintClient which includes API key authentication
 */
export class FingerprintService {
	private static readonly BASE_URL = "/fingerprint";

	/**
	 * Register a new fingerprint
	 */
	static async registerFingerprint(
		data: FingerprintRegistration
	): Promise<Fingerprint> {
		return ApiFingerprintClient.post<Fingerprint, FingerprintRegistration>(
			`${this.BASE_URL}/register`,
			data
		);
	}

	/**
	 * Mark fingerprint attendance
	 */
	static async markAttendance(
		data: FingerprintAttendanceRequest
	): Promise<FingerprintAttendance> {
		return ApiFingerprintClient.post<FingerprintAttendance, FingerprintAttendanceRequest>(
			`${this.BASE_URL}/attendance`,
			data
		);
	}

	/**
	 * Check if a fingerprint is registered
	 */
	static async checkFingerprint(
		fingerprintId: string
	): Promise<FingerprintCheckResponse> {
		return ApiFingerprintClient.get<FingerprintCheckResponse>(
			`${this.BASE_URL}/check/${fingerprintId}`
		);
	}

	/**
	 * Get all registered fingerprints with pagination and filtering
	 */
	static async getAllFingerprints(
		filters: FingerprintListFilters = {}
	): Promise<PaginatedResponse<Fingerprint>> {
		const searchParams = new URLSearchParams();

		if (filters.department) {
			searchParams.append("department", filters.department);
		}
		if (filters.search) {
			searchParams.append("search", filters.search);
		}
		if (filters.page) {
			searchParams.append("page", filters.page.toString());
		}
		if (filters.limit) {
			searchParams.append("limit", filters.limit.toString());
		}

		const queryString = searchParams.toString();
		const url = queryString
			? `${this.BASE_URL}/fingerprints?${queryString}`
			: `${this.BASE_URL}/fingerprints`;

		return ApiFingerprintClient.get<PaginatedResponse<Fingerprint>>(url);
	}

	/**
	 * Get fingerprint attendance history with pagination and filtering
	 */
	static async getAttendanceHistory(
		filters: FingerprintAttendanceFilters = {}
	): Promise<PaginatedResponse<FingerprintAttendance>> {
		const searchParams = new URLSearchParams();

		if (filters.department) {
			searchParams.append("department", filters.department);
		}
		if (filters.fingerprintId) {
			searchParams.append("fingerprintId", filters.fingerprintId);
		}
		if (filters.startDate) {
			searchParams.append("startDate", filters.startDate);
		}
		if (filters.endDate) {
			searchParams.append("endDate", filters.endDate);
		}
		if (filters.page) {
			searchParams.append("page", filters.page.toString());
		}
		if (filters.limit) {
			searchParams.append("limit", filters.limit.toString());
		}

		const queryString = searchParams.toString();
		const url = queryString
			? `${this.BASE_URL}/attendance?${queryString}`
			: `${this.BASE_URL}/attendance`;

		return ApiFingerprintClient.get<PaginatedResponse<FingerprintAttendance>>(url);
	}

	/**
	 * Get attendance statistics for a specific period
	 */
	static async getAttendanceStats(filters: {
		startDate?: string;
		endDate?: string;
		department?: string;
	} = {}): Promise<{
		summary: {
			totalAttendance: number;
			uniqueUsers: number;
		};
		byDepartment: Array<{
			department: string;
			count: number;
			uniqueUsers: number;
		}>;
		dailyTrend: Array<{
			date: string;
			count: number;
			uniqueUsers: number;
		}>;
	}> {
		const searchParams = new URLSearchParams();

		if (filters.startDate) {
			searchParams.append("startDate", filters.startDate);
		}
		if (filters.endDate) {
			searchParams.append("endDate", filters.endDate);
		}
		if (filters.department) {
			searchParams.append("department", filters.department);
		}

		const queryString = searchParams.toString();
		const url = queryString
			? `${this.BASE_URL}/attendance/stats?${queryString}`
			: `${this.BASE_URL}/attendance/stats`;

		const response = await ApiFingerprintClient.get<{ data: any }>(url);
		return response.data;
	}

	/**
	 * Get individual user attendance report
	 */
	static async getUserAttendanceReport(
		fingerprintId: string,
		filters: {
			startDate?: string;
			endDate?: string;
		} = {}
	): Promise<{
		user: {
			fingerprintId: string;
			name: string;
			department: string;
		};
		attendance: {
			total: number;
			records: FingerprintAttendance[];
		};
	}> {
		const searchParams = new URLSearchParams();

		if (filters.startDate) {
			searchParams.append("startDate", filters.startDate);
		}
		if (filters.endDate) {
			searchParams.append("endDate", filters.endDate);
		}

		const queryString = searchParams.toString();
		const url = queryString
			? `${this.BASE_URL}/attendance/user/${fingerprintId}?${queryString}`
			: `${this.BASE_URL}/attendance/user/${fingerprintId}`;

		const response = await ApiFingerprintClient.get<{ data: any }>(url);
		return response.data;
	}
}

/**
 * Device Control API service
 * Uses ApiFingerprintClient which includes API key authentication
 */
export class DeviceControlService {
	private static readonly BASE_URL = "/fingerprint/device";

	/**
	 * Set device mode (register or attendance)
	 */
	static async setDeviceMode(
		deviceId: string,
		mode: "register" | "attendance"
	): Promise<{ message: string; data: any }> {
		return ApiFingerprintClient.post<
			{ message: string; data: any },
			{ deviceId: string; mode: string }
		>(`${this.BASE_URL}/mode`, { deviceId, mode });
	}

	/**
	 * Request device status
	 */
	static async getDeviceStatus(deviceId: string): Promise<{ message: string; data: any }> {
		return ApiFingerprintClient.get<{ message: string; data: any }>(
			`${this.BASE_URL}/status/${deviceId}`
		);
	}

	/**
	 * Send registration data to device
	 */
	static async sendRegistrationData(
		deviceId: string,
		name: string,
		department: string
	): Promise<{ message: string; data: any }> {
		return ApiFingerprintClient.post<
			{ message: string; data: any },
			{ deviceId: string; name: string; department: string }
		>(`${this.BASE_URL}/registration-data`, { deviceId, name, department });
	}

	/**
	 * Broadcast command to all devices
	 */
	static async broadcastToAllDevices(
		command: string,
		mode?: "register" | "attendance"
	): Promise<{ message: string; data: any }> {
		const payload: { command: string; mode?: string } = { command };
		if (mode !== undefined) payload.mode = mode;
		return ApiFingerprintClient.post<
			{ message: string; data: any },
			{ command: string; mode?: string }
		>(`${this.BASE_URL}/broadcast`, payload);
	}
}
