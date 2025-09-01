import { z } from "zod";

// Sign in form schema
export const signInSchema = z.object({
	email: z
		.string()
		.min(1, "Email is required")
		.email("Enter valid email address"),
	password: z
		.string()
		.min(1, "Password is required")
		.min(6, "Password must be at least 6 characters"),
	rememberMe: z.boolean(),
});

// Sign up form schema
export const signUpSchema = z
	.object({
		name: z
			.string()
			.min(1, "Name is required")
			.min(2, "Name must be at least 2 characters"),
		email: z.email("Enter valid email address").min(1, "Email is required"),
		password: z
			.string()
			.min(1, "Password is required")
			.min(6, "Password must be at least 6 characters"),
		confirmPassword: z.string().min(1, "Please confirm your password"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

// Inferred types
export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;

// Legacy schema for backward compatibility
/** @deprecated Use signInSchema instead */
export const formSchema = signInSchema;

/** @deprecated Use SignInFormData instead */
export type authFormType = SignInFormData;
