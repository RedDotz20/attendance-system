import { z } from "zod";

export const rfidRegistrationSchema = z.object({
	uid: z
		.string()
		.min(1, "RFID UID is required")
		.max(50, "RFID UID is too long")
		.transform((val) => val.toUpperCase().trim()),
	name: z
		.string()
		.min(1, "Name is required")
		.max(100, "Name is too long")
		.transform((val) => val.trim()),
	department: z
		.string()
		.min(1, "Department is required")
		.max(50, "Department is too long")
		.transform((val) => val.trim()),
});

export const attendanceSchema = z.object({
	uid: z
		.string()
		.min(1, "RFID UID is required")
		.max(50, "RFID UID is too long")
		.transform((val) => val.toUpperCase().trim()),
});

export const uidParamSchema = z.object({
	uid: z
		.string()
		.min(1, "RFID UID is required")
		.max(50, "RFID UID is too long")
		.transform((val) => val.toUpperCase().trim()),
});

export type RfidRegistrationInput = z.infer<typeof rfidRegistrationSchema>;
export type AttendanceInput = z.infer<typeof attendanceSchema>;
export type UidParam = z.infer<typeof uidParamSchema>;
