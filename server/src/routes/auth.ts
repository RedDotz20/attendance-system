import { Hono } from "hono";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import {
	createSession,
	getSession,
	deleteSession,
} from "../utils/sessionUtils.js";

const auth = new Hono();

// Sign up
auth.post("/signup", async (c) => {
	const { name, email, password, role } = await c.req.json();
	const existing = await User.findOne({ email });
	if (existing) return c.text("Email exists", 400);

	const hashed = await bcrypt.hash(password, 10);
	const user = await User.create({ name, email, password: hashed, role });

	const { sessionId } = await createSession(user._id.toString());
	setCookie(c, "sessionId", sessionId, {
		httpOnly: true,
		secure: false,
		maxAge: 60 * 60 * 24 * 7, // 7 days
		path: "/",
	});

	return c.json({ user: { name, email, role } });
});

// Sign in
auth.post("/signin", async (c) => {
	const existingSessionId = getCookie(c, "sessionId");

	if (existingSessionId) {
		const session = await getSession(existingSessionId);
		if (session) {
			const userId = session.userId;
			const user = await User.findById(userId);
			if (!user) return c.text("User not found", 404);
			return c.json(
				{
					message: "Already signed in",
					user: {
						name: user.name,
						email: user.email,
						role: user.role,
					},
				},
				200
			);
		}
	}

	const { email, password } = await c.req.json();
	const user = await User.findOne({ email });
	if (!user || !(await bcrypt.compare(password, user.password)))
		return c.text("Invalid credentials", 401);

	const { sessionId } = await createSession(user._id.toString());
	setCookie(c, "sessionId", sessionId, {
		httpOnly: true,
		secure: false,
		maxAge: 60 * 60 * 24 * 7,
		path: "/",
	});

	return c.json({
		user: { name: user.name, email: user.email, role: user.role },
	});
});

// Get session user
auth.get("/me", async (c) => {
	const sessionId = getCookie(c, "sessionId");
	if (!sessionId) return c.text("Not logged in", 401);

	const session = await getSession(sessionId);
	if (!session) return c.text("Invalid session", 401);

	const userId = session.userId;
	const user = await User.findById(userId);
	if (!user) return c.text("User not found", 404);

	return c.json({
		user: { name: user.name, email: user.email, role: user.role },
	});
});

// Logout
auth.post("/logout", async (c) => {
	const sessionId = getCookie(c, "sessionId");
	if (sessionId) {
		await deleteSession(sessionId);
		deleteCookie(c, "sessionId");
	}
	return c.text("Logged out");
});

export default auth;
