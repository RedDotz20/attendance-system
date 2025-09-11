import { z } from "zod";

/**
 * Validation schemas for fingerprint operations
 */

export const fingerprintRegistrationSchema = z.object({
	fingerprintId: z
		.string()
		.min(1, "Fingerprint ID is required")
		.max(10, "Fingerprint ID must be 10 characters or less")
		.regex(/^\d+$/, "Fingerprint ID must contain only numbers"),
	name: z
		.string()
		.min(1, "Name is required")
		.max(100, "Name must be 100 characters or less")
		.trim(),
	department: z
		.string()
		.min(1, "Department is required")
		.max(50, "Department must be 50 characters or less")
		.trim(),
});

export const fingerprintAttendanceSchema = z.object({
	fingerprintId: z
		.string()
		.min(1, "Fingerprint ID is required")
		.max(10, "Fingerprint ID must be 10 characters or less")
		.regex(/^\d+$/, "Fingerprint ID must contain only numbers"),
});

export const fingerprintSearchSchema = z.object({
	search: z.string().optional(),
	department: z.string().optional(),
	page: z.number().min(1).optional(),
	limit: z.number().min(1).max(100).optional(),
});

export const fingerprintAttendanceFiltersSchema = z.object({
	department: z.string().optional(),
	fingerprintId: z.string().optional(),
	startDate: z.string().datetime().optional(),
	endDate: z.string().datetime().optional(),
	page: z.number().min(1).optional(),
	limit: z.number().min(1).max(100).optional(),
});

export type FingerprintRegistrationFormData = z.infer<
	typeof fingerprintRegistrationSchema
>;
export type FingerprintAttendanceFormData = z.infer<
	typeof fingerprintAttendanceSchema
>;
export type FingerprintSearchFormData = z.infer<typeof fingerprintSearchSchema>;
export type FingerprintAttendanceFiltersFormData = z.infer<
	typeof fingerprintAttendanceFiltersSchema
>;
