// Sign Up / Register User
import type { Context } from "hono";
import { setCookie } from "hono/cookie";
import bcrypt from "bcryptjs";
import { User } from "@/modules/users/models/user.model.js";
import { createSession } from "@/modules/auth/service/session.service.js";
import { SignUpSchema } from "@/modules/users/validators/user.validator.js";
import z from "zod";

export const SignUpController = async (c: Context) => {
	const body = await c.req.json();
	const parsed = SignUpSchema.safeParse(body);

	if (!parsed.success) {
		const { fieldErrors, formErrors } = z.flattenError(parsed.error);
		return c.json(
			{
				message: "Validation Failed",
				errors: fieldErrors,
				// Optionally include any form-wide errors:
				...(formErrors.length > 0 ? { formErrors } : {}),
			},
			400
		);
	}

	const { name, email, password, role } = parsed.data;

	const existing = await User.findOne({ email });
	if (existing) return c.json({ message: "Email Already Exists" }, 409);

	const hashed = await bcrypt.hash(password, 10);
	const user = await User.create({ name, email, password: hashed, role });

	const { sessionId } = await createSession(
		(user._id as { toString: () => string }).toString()
	);

	setCookie(c, "sessionId", sessionId, {
		httpOnly: true,
		secure: false,
		maxAge: 60 * 60 * 24 * 7, // 7 days
		path: "/",
	});

	return c.json({ user: { name, email, role } });
};
