import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { getSession } from "../utils/sessionUtils.js";

export const sessionAuth: MiddlewareHandler = async (c, next) => {
	const sessionId = getCookie(c, "sessionId");
	if (!sessionId) return c.text("Unauthorized", 401);

	const session = await getSession(sessionId);
	if (!session) return c.text("Invalid session", 401);

	c.set("user", session.userId); // include user in context
	await next();
};

export const requireRole =
	(role: "admin" | "user"): MiddlewareHandler =>
	async (c, next) => {
		const user = c.get("user");
		if (user.role !== role) return c.text("Forbidden", 403);
		await next();
	};
