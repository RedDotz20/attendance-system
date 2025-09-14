export interface RfidCardRegistration {
	uid: string;
	name: string;
	department: string;
}

export interface AttendanceRecord {
	uid: string;
	name: string;
	department: string;
	timestamp: Date;
}

export interface RfidCardResponse {
	success: boolean;
	message: string;
	data?: any;
}

export interface AttendanceResponse {
	success: boolean;
	message: string;
	data?: AttendanceRecord;
}
