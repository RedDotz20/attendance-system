import bcrypt from "bcryptjs";
import { setCookie, getCookie } from "hono/cookie";
import { User } from "@/modules/users/models/user.model.js";
import {
	createSession,
	getSession,
} from "@/modules/auth/service/session.service.js";
import { SignInSchema } from "@/modules/users/validators/user.validator.js";
import type { Context } from "hono";

// Sign-In / Login User
export const SignInController = async (c: Context) => {
	const existingSessionId = getCookie(c, "sessionId");

	if (existingSessionId) {
		const session = await getSession(existingSessionId);
		if (session) {
			const user = await User.findById(session.userId);
			if (!user) return c.text("User not found", 404);
			return c.json({
				message: "Already signed in",
				user: { name: user.name, email: user.email, role: user.role },
			});
		}
	}

	const body = await c.req.json();
	const parsed = SignInSchema.safeParse(body);

	if (!parsed.success) {
		const { fieldErrors, formErrors } = parsed.error.flatten();
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

	const { email, password } = parsed.data;
	const user = await User.findOne({ email });

	if (!user || !(await bcrypt.compare(password, user.password))) {
		return c.json(
			{
				message: "Invalid credentials",
				user: { name: null, email: null, role: null },
			},
			401
		);
	}

	const { sessionId } = await createSession(
		(user._id as { toString: () => string }).toString()
	);

	setCookie(c, "sessionId", sessionId, {
		httpOnly: true,
		secure: false,
		maxAge: 60 * 60 * 24 * 7,
		path: "/",
	});

	return c.json({
		message: "SignedIn Successfully",
		isAuthenticated: true,
		user: {
			id: (user._id as { toString: () => string }).toString(),
			name: user.name,
			email: user.email,
			role: user.role,
		},
	});
};
