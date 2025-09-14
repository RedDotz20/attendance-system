import { z } from "zod";

export const fingerprintRegistrationSchema = z.object({
	fingerprintId: z
		.string()
		.min(1, "Fingerprint ID is required")
		.max(10, "Fingerprint ID is too long")
		.transform((val) => val.trim()),
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

export const fingerprintAttendanceSchema = z.object({
	fingerprintId: z
		.string()
		.min(1, "Fingerprint ID is required")
		.max(10, "Fingerprint ID is too long")
		.transform((val) => val.trim()),
});

export const fingerprintIdParamSchema = z.object({
	fingerprintId: z
		.string()
		.min(1, "Fingerprint ID is required")
		.max(10, "Fingerprint ID is too long")
		.transform((val) => val.trim()),
});

export type FingerprintRegistrationInput = z.infer<
	typeof fingerprintRegistrationSchema
>;
export type FingerprintAttendanceInput = z.infer<
	typeof fingerprintAttendanceSchema
>;
export type FingerprintIdParam = z.infer<typeof fingerprintIdParamSchema>;
