import z from "zod";

export const formSchema = z.object({
	email: z.email("Enter Valid Email Address").min(1, "Email is required"),
	password: z
		.string()
		.min(6, "Password must be at least 6 characters")
		.min(1, "Password is required"),
	rememberMe: z.boolean(),
});
