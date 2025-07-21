import { z } from "zod";

export const SignUpSchema = z.object({
	name: z.string().min(1, "Name is required").trim(),
	email: z.email("Invalid email").trim(),
	password: z.string().min(6, "Password must be at least 6 characters").trim(),
	role: z.enum(["admin", "user"]).optional().default("user"),
});

export const SignInSchema = z.object({
	email: z.email("Invalid email").trim(),
	password: z.string().min(6, "Password must be at least 6 characters").trim(),
});
