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

export interface FingerprintListResponse {
	message: string;
	data: Fingerprint[];
	count: number;
	total: number;
}

export interface AttendanceLogFilters {
	department?: string;
	eventType?: string;
	startDate?: string;
	endDate?: string;
	page?: number;
	limit?: number;
}

/**
 * Represents an attendance log entry from the server
 */
export interface AttendanceLog {
	_id: string;
	fingerprintId: string;
	name: string;
	department: string;
	timestamp: string;
	eventType: "attendance" | "registration" | "device_status";
	deviceId?: string;
	metadata?: Record<string, unknown>;
	createdAt: string;
	updatedAt: string;
}

/**
 * Fingerprint with optional _id field from MongoDB
 */
export interface FingerprintWithId extends Fingerprint {
	_id?: string;
}

/**
 * Fingerprint attendance with optional _id field from MongoDB
 */
export interface FingerprintAttendanceWithId extends FingerprintAttendance {
	_id?: string;
}
