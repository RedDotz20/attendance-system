// Sign Up / Register User
import type { Context } from "hono";
import { setCookie } from "hono/cookie";
import bcrypt from "bcryptjs";
import { User } from "@/modules/users/models/user.model.js";
import { sessionService } from "@/modules/auth/service/session.service.js";
import { SignUpSchema } from "@/modules/users/validators/user.validator.js";
import { success, validationError, error } from "@/shared/utils/response.js";
import z from "zod";

export const SignUpController = async (c: Context) => {
	const body = await c.req.json();
	const parsed = SignUpSchema.safeParse(body);

	if (!parsed.success) {
		const errors = parsed.error.issues.map((err) => ({
			field: err.path.join("."),
			message: err.message,
			code: err.code,
		}));
		return validationError(c, errors, "Validation failed");
	}

	const { name, email, password, role } = parsed.data;

	const existing = await User.findOne({ email });
	if (existing) {
		return error(c, "Email already exists", "EMAIL_EXISTS", 409);
	}

	const hashed = await bcrypt.hash(password, 10);
	const user = await User.create({ name, email, password: hashed, role });

	const userId = (user._id as { toString: () => string }).toString();
	const sessionResult = await sessionService.createSession(userId);

	if (!sessionResult.success) {
		return error(c, "Failed to create session", "SESSION_ERROR", 500);
	}

	const { sessionId } = sessionResult.data;
	const cookieOptions = sessionService.getCookieOptions();
	setCookie(c, "sessionId", sessionId, cookieOptions);

	return success(
		c,
		{
			user: {
				id: userId,
				name: user.name,
				email: user.email,
				role: user.role,
				createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : new Date().toISOString(),
				updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : new Date().toISOString(),
			},
			isAuthenticated: true,
		},
		"Registration successful"
	);
};
