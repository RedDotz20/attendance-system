import { ApiClient } from "@/lib/api-client";
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
 */
export class FingerprintService {
	private static readonly BASE_URL = "/fingerprint";

	/**
	 * Register a new fingerprint
	 */
	static async registerFingerprint(
		data: FingerprintRegistration
	): Promise<Fingerprint> {
		return ApiClient.post<Fingerprint, FingerprintRegistration>(
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
		return ApiClient.post<FingerprintAttendance, FingerprintAttendanceRequest>(
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
		return ApiClient.get<FingerprintCheckResponse>(
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

		return ApiClient.get<PaginatedResponse<Fingerprint>>(url);
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

		return ApiClient.get<PaginatedResponse<FingerprintAttendance>>(url);
	}

	/**
	 * Get attendance statistics for a specific period
	 */
	static async getAttendanceStats(
		startDate?: string,
		endDate?: string
	): Promise<{
		totalAttendance: number;
		uniqueEmployees: number;
		departmentStats: Array<{
			department: string;
			count: number;
		}>;
		dailyStats: Array<{
			date: string;
			count: number;
		}>;
	}> {
		const searchParams = new URLSearchParams();

		if (startDate) {
			searchParams.append("startDate", startDate);
		}
		if (endDate) {
			searchParams.append("endDate", endDate);
		}

		const queryString = searchParams.toString();
		const url = queryString
			? `${this.BASE_URL}/stats?${queryString}`
			: `${this.BASE_URL}/stats`;

		return ApiClient.get(url);
	}
}
