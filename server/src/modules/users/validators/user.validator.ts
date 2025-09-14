/**
 * User validation schemas with strict typing
 */

import { z } from "zod";
import { UserRoles } from "@/modules/users/types/user.type.js";

// Base validation rules
const nameValidation = z
	.string()
	.min(1, "Name is required")
	.max(100, "Name cannot exceed 100 characters")
	.trim();

const emailValidation = z
	.string()
	.email("Invalid email format")
	.max(255, "Email cannot exceed 255 characters")
	.trim()
	.toLowerCase();

const passwordValidation = z
	.string()
	.min(6, "Password must be at least 6 characters")
	.max(128, "Password cannot exceed 128 characters")
	.regex(
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
		"Password must contain at least one lowercase letter, one uppercase letter, and one number"
	);

const roleValidation = z
	.enum([UserRoles.ADMIN, UserRoles.USER] as const)
	.default(UserRoles.USER);

// Sign up schema
export const SignUpSchema = z.object({
	name: nameValidation,
	email: emailValidation,
	password: passwordValidation,
	role: roleValidation.optional(),
});

// Sign in schema
export const SignInSchema = z.object({
	email: emailValidation,
	password: z.string().min(1, "Password is required"),
});

// Update user schema
export const UpdateUserSchema = z.object({
	name: nameValidation.optional(),
	email: emailValidation.optional(),
	role: roleValidation.optional(),
});

// Change password schema
export const ChangePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, "Current password is required"),
		newPassword: passwordValidation,
		confirmPassword: z.string().min(1, "Confirm password is required"),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

// User query parameters schema
export const UserQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(10),
	search: z.string().optional(),
	role: roleValidation.optional(),
	sortBy: z
		.enum(["name", "email", "createdAt", "updatedAt"])
		.default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// User ID parameter schema
export const UserIdSchema = z.object({
	id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format"),
});

// Type exports for use in controllers
export type SignUpInput = z.infer<typeof SignUpSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type UserQueryInput = z.infer<typeof UserQuerySchema>;
export type UserIdInput = z.infer<typeof UserIdSchema>;
