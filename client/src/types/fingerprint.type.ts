/**
 * Fingerprint-related types for the client application
 */

export interface Fingerprint {
	fingerprintId: string;
	name: string;
	department: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface FingerprintRegistration {
	fingerprintId: string;
	name: string;
	department: string;
}

export interface FingerprintAttendance {
	fingerprintId: string;
	name: string;
	department: string;
	timestamp: string;
}

export interface FingerprintAttendanceRequest {
	fingerprintId: string;
}

export interface FingerprintCheckResponse {
	fingerprintId: string;
	name: string;
	department: string;
	isActive: boolean;
	createdAt: string;
	registered: boolean;
}

export interface FingerprintListFilters {
	department?: string;
	search?: string;
	page?: number;
	limit?: number;
}

export interface FingerprintAttendanceFilters {
	department?: string;
	fingerprintId?: string;
	startDate?: string;
	endDate?: string;
	page?: number;
	limit?: number;
}
