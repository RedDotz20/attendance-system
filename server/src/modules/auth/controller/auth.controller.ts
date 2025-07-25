import type { Context } from "hono";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import bcrypt from "bcryptjs";
import { User } from "@/modules/users/models/user.model.js";
import {
	createSession,
	getSession,
	deleteSession,
} from "@/modules/auth/service/session.service.js";
import {
	SignUpSchema,
	SignInSchema,
} from "@/modules/users/validators/user.validator.js";
import z from "zod";

// Sign Up / Register User
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
		user: { name: user.name, email: user.email, role: user.role },
	});
};

// Get User Session Status
export const GetSessionUserController = async (c: Context) => {
	const sessionId = getCookie(c, "sessionId");
	if (!sessionId) {
		return c.json(
			{ user: null, authenticated: false, message: "User is Not Logged In" },
			401
		);
	}

	const session = await getSession(sessionId);
	if (!session) {
		return c.json(
			{ user: null, authenticated: false, message: "Invalid session" },
			401
		);
	}

	const user = await User.findById(session.userId);
	if (!user) {
		return c.json(
			{ user: null, authenticated: false, message: "User Not Found" },
			404
		);
	}

	return c.json({
		user: {
			id: (user._id as { toString: () => string }).toString(),
			name: user.name,
			email: user.email,
			role: user.role,
		},
		authenticated: true,
	});
};

// Sign-out / Logout User
export const LogOutController = async (c: Context) => {
	const sessionId = getCookie(c, "sessionId");
	if (sessionId) {
		await deleteSession(sessionId);
		deleteCookie(c, "sessionId");
		return c.json({ message: "User Successfully Logged out" });
	}

	return c.json({ message: "User is Not Logged In" }, 400);
};
