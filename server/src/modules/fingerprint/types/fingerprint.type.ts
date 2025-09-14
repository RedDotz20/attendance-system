export interface FingerprintRegistration {
	fingerprintId: string;
	name: string;
	department: string;
}

export interface FingerprintAttendanceRequest {
	fingerprintId: string;
}

export interface FingerprintResponse {
	fingerprintId: string;
	name: string;
	department: string;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface FingerprintAttendanceResponse {
	fingerprintId: string;
	name: string;
	department: string;
	timestamp: Date;
}
