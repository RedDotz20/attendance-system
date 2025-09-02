import type { Context, Next } from "hono";
import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { getSession } from "../../modules/auth/service/session.service.js";

export const sessionAuth: MiddlewareHandler = async (
	c: Context,
	next: Next
) => {
	const sessionId = getCookie(c, "sessionId");
	if (!sessionId) return c.json({ message: "Unauthorized" }, 401);

	const session = await getSession(sessionId);
	if (!session) return c.json({ message: "Invalid Session" }, 401);

	c.set("user", session.userId); // include user in context
	await next();
};

export const requireRole =
	(requiredRole: "admin" | "user"): MiddlewareHandler =>
	async (c: Context, next: Next) => {
		const user = c.get("user");

		if (!user || !user.role) {
			return c.json({ message: "Unauthorized" }, 401);
		}

		// Admin can access everything
		if (user.role === "admin") {
			return await next();
		}

		// User can only access user routes
		if (user.role === requiredRole) {
			return await next();
		}

		return c.json({ message: "Forbidden" }, 403);
	};
